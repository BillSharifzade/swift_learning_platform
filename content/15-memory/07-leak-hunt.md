---
title: Охота на утечки
concept: Итог модуля — найти и устранить все виды утечек памяти
---

## @description

### Контекст
Перед релизом «Кадра» тимлид запустил профилировщик памяти. Отчёт короткий: «Открыть фото в редакторе, сделать пару правок, сохранить в облако, закрыть. Редактор не освобождается. Вместе с ним в памяти остаются панель инструментов, история правок и обработчик фото».

Тимлид передаёт задачу тебе: «Утечек несколько, и все разные. Ты уже чинила каждую из них по отдельности. Найди все и почини так, чтобы редактор работал как раньше».

### Что пригодится
Нового здесь нет, только то, что ты освоила в этом модуле.

**Счётчик ссылок.** Объект освобождается, когда исчезает последняя сильная ссылка на него. Если после закрытия в журнале нет записи об освобождении, его кто-то держит.

**Как искать.** Возьми объект, который утёк, и найди всех, кто на него ссылается:

- свойства других объектов, в которые его положили: `panel.owner = self`;
- делегаты: `service.delegate = self`;
- замыкания, в которых встречается `self` и которые где-то хранятся.

Если от объекта по сильным ссылкам можно вернуться к нему же, это цикл. Если его держит объект, который живёт дольше, это тоже утечка, хоть и без цикла.

**Чем чинить:**

```swift
weak var owner: AlbumScreen?                 // обратная ссылка на владельца

protocol UploadDelegate: AnyObject { ... }   // слабый делегат
weak var delegate: UploadDelegate?

service.onFinish = { [weak self] result in   // хранимое замыкание
    guard let self else {
        return
    }
    self.status = result
}

queue.add { [title, count] in                // нужны значения, а не объект
    "\(title): \(count)"
}
```

Помни, чем отличаются последние два способа. `[weak self]` подходит, когда без объекта работа теряет смысл: экрана нет, и обновлять нечего. Список захвата со значениями подходит, когда работа должна выполниться и после закрытия, со значениями на момент постановки.

### Задача
В редакторе классы `Toolbar`, `HistoryPanel` с протоколом делегата, `ImageProcessor`, `CloudSync` и сам `PhotoEditorScreen`. Синхронизация с облаком `CloudSync` одна на всё приложение и живёт дольше любого редактора.

1. Нажми «Проверить», ничего не меняя. В журнале нет ни одной записи об освобождении.
2. Найди все места, где что-то держит редактор сильной ссылкой, и исправь каждое подходящим способом. Их четыре.
3. Исправляй только объявления ссылок и замыкания. Как объекты создаются и связываются в `init`, не меняй. Строки `toolbar.editor = self`, `history.delegate = self` и замыкание `processor.onComplete` должны остаться.
4. Поведение редактора не меняется: тексты статусов, отмена, возврат к шагу истории — всё работает как раньше.
5. Выгрузка в облако должна состояться и после закрытия редактора. В ней указывается количество правок на момент вызова `saveToCloud()`, а не на момент выгрузки.

### Пример
```swift
let sync = CloudSync()
let editor = PhotoEditorScreen(fileName: "IMG_3105.jpg", sync: sync)
editor.apply("Яркость +10")
editor.processor.complete()
editor.statusText                // "Применено: Яркость +10"
editor.saveToCloud()
editor.toolbar.tapUndo()
editor.statusText                // "Отменено: Яркость +10"
sync.uploadAll()                 // ["IMG_3105.jpg, правок: 1"]
```

Сценарий из редактора должен вывести:

```text
Применено: Виньетка
Возврат к шагу 2
Отменено: Контраст +5
IMG_2041.jpg, правок: 2
Редактор закрыт: IMG_2041.jpg
Панель инструментов освобождена
История правок освобождена
Обработчик фото освобождён
Синхронизация с облаком
```

## @starter
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Панель инструментов. Кнопка "Отменить" вызывает действие редактора
class Toolbar {
    var editor: PhotoEditorScreen?

    func tapUndo() {
        editor?.undoLastStep()
    }

    deinit {
        lifecycleLog.append("Панель инструментов освобождена")
    }
}

// История правок. О выборе шага сообщает делегату
protocol HistoryPanelDelegate {
    func historyPanel(_ panel: HistoryPanel, didSelectStep index: Int)
}

class HistoryPanel {
    var steps: [String] = []
    var delegate: HistoryPanelDelegate?

    func selectStep(at index: Int) {
        guard index >= 0 && index < steps.count else {
            return
        }
        delegate?.historyPanel(self, didSelectStep: index)
    }

    deinit {
        lifecycleLog.append("История правок освобождена")
    }
}

// Обработчик фото. Когда правка наложена, вызывает onComplete
class ImageProcessor {
    var pendingAdjustment = ""
    var onComplete: ((String) -> Void)?

    func process(_ adjustment: String) {
        pendingAdjustment = adjustment
    }

    // Обработка закончилась
    func complete() {
        onComplete?(pendingAdjustment)
    }

    deinit {
        lifecycleLog.append("Обработчик фото освобождён")
    }
}

// Синхронизация с облаком. Одна на всё приложение
class CloudSync {
    var pendingUploads: [() -> String] = []

    func enqueue(_ upload: @escaping () -> String) {
        pendingUploads.append(upload)
    }

    // Выгружает всё по порядку и очищает очередь
    func uploadAll() -> [String] {
        let results = pendingUploads.map { upload in upload() }
        pendingUploads = []
        return results
    }
}

// Экран редактора
class PhotoEditorScreen: HistoryPanelDelegate {
    let fileName: String
    let toolbar = Toolbar()
    let history = HistoryPanel()
    let processor = ImageProcessor()
    let sync: CloudSync
    var adjustments: [String] = []
    var statusText = "Нет правок"

    init(fileName: String, sync: CloudSync) {
        self.fileName = fileName
        self.sync = sync
        toolbar.editor = self
        history.delegate = self
        processor.onComplete = { adjustment in
            self.adjustments.append(adjustment)
            self.history.steps = self.adjustments
            self.statusText = "Применено: \(adjustment)"
        }
    }

    func apply(_ adjustment: String) {
        processor.process(adjustment)
    }

    func undoLastStep() {
        guard !adjustments.isEmpty else {
            statusText = "Отменять нечего"
            return
        }
        let removed = adjustments.removeLast()
        history.steps = adjustments
        statusText = "Отменено: \(removed)"
    }

    func historyPanel(_ panel: HistoryPanel, didSelectStep index: Int) {
        while adjustments.count > index + 1 {
            adjustments.removeLast()
        }
        history.steps = adjustments
        statusText = "Возврат к шагу \(index + 1)"
    }

    func saveToCloud() {
        sync.enqueue {
            return "\(self.fileName), правок: \(self.adjustments.count)"
        }
    }

    deinit {
        lifecycleLog.append("Редактор закрыт: \(fileName)")
    }
}

// Сценарий из отчёта профилировщика
let cloudSync = CloudSync()
var editor: PhotoEditorScreen? = PhotoEditorScreen(fileName: "IMG_2041.jpg", sync: cloudSync)
editor?.apply("Яркость +10")
editor?.processor.complete()
editor?.apply("Контраст +5")
editor?.processor.complete()
editor?.apply("Виньетка")
editor?.processor.complete()
print(editor?.statusText ?? "Редактор закрыт")

editor?.history.selectStep(at: 1)
print(editor?.statusText ?? "Редактор закрыт")

editor?.saveToCloud()
editor?.toolbar.tapUndo()
print(editor?.statusText ?? "Редактор закрыт")

editor = nil
lifecycleLog.append("Синхронизация с облаком")
for line in cloudSync.uploadAll() {
    print(line)
}
for entry in lifecycleLog {
    print(entry)
}
```

## @solution
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Панель инструментов. Кнопка "Отменить" вызывает действие редактора
class Toolbar {
    weak var editor: PhotoEditorScreen?

    func tapUndo() {
        editor?.undoLastStep()
    }

    deinit {
        lifecycleLog.append("Панель инструментов освобождена")
    }
}

// История правок. О выборе шага сообщает делегату
protocol HistoryPanelDelegate: AnyObject {
    func historyPanel(_ panel: HistoryPanel, didSelectStep index: Int)
}

class HistoryPanel {
    var steps: [String] = []
    weak var delegate: HistoryPanelDelegate?

    func selectStep(at index: Int) {
        guard index >= 0 && index < steps.count else {
            return
        }
        delegate?.historyPanel(self, didSelectStep: index)
    }

    deinit {
        lifecycleLog.append("История правок освобождена")
    }
}

// Обработчик фото. Когда правка наложена, вызывает onComplete
class ImageProcessor {
    var pendingAdjustment = ""
    var onComplete: ((String) -> Void)?

    func process(_ adjustment: String) {
        pendingAdjustment = adjustment
    }

    // Обработка закончилась
    func complete() {
        onComplete?(pendingAdjustment)
    }

    deinit {
        lifecycleLog.append("Обработчик фото освобождён")
    }
}

// Синхронизация с облаком. Одна на всё приложение
class CloudSync {
    var pendingUploads: [() -> String] = []

    func enqueue(_ upload: @escaping () -> String) {
        pendingUploads.append(upload)
    }

    // Выгружает всё по порядку и очищает очередь
    func uploadAll() -> [String] {
        let results = pendingUploads.map { upload in upload() }
        pendingUploads = []
        return results
    }
}

// Экран редактора
class PhotoEditorScreen: HistoryPanelDelegate {
    let fileName: String
    let toolbar = Toolbar()
    let history = HistoryPanel()
    let processor = ImageProcessor()
    let sync: CloudSync
    var adjustments: [String] = []
    var statusText = "Нет правок"

    init(fileName: String, sync: CloudSync) {
        self.fileName = fileName
        self.sync = sync
        toolbar.editor = self
        history.delegate = self
        processor.onComplete = { [weak self] adjustment in
            guard let self else {
                return
            }
            self.adjustments.append(adjustment)
            self.history.steps = self.adjustments
            self.statusText = "Применено: \(adjustment)"
        }
    }

    func apply(_ adjustment: String) {
        processor.process(adjustment)
    }

    func undoLastStep() {
        guard !adjustments.isEmpty else {
            statusText = "Отменять нечего"
            return
        }
        let removed = adjustments.removeLast()
        history.steps = adjustments
        statusText = "Отменено: \(removed)"
    }

    func historyPanel(_ panel: HistoryPanel, didSelectStep index: Int) {
        while adjustments.count > index + 1 {
            adjustments.removeLast()
        }
        history.steps = adjustments
        statusText = "Возврат к шагу \(index + 1)"
    }

    func saveToCloud() {
        sync.enqueue { [fileName, adjustments] in
            return "\(fileName), правок: \(adjustments.count)"
        }
    }

    deinit {
        lifecycleLog.append("Редактор закрыт: \(fileName)")
    }
}

// Сценарий из отчёта профилировщика
let cloudSync = CloudSync()
var editor: PhotoEditorScreen? = PhotoEditorScreen(fileName: "IMG_2041.jpg", sync: cloudSync)
editor?.apply("Яркость +10")
editor?.processor.complete()
editor?.apply("Контраст +5")
editor?.processor.complete()
editor?.apply("Виньетка")
editor?.processor.complete()
print(editor?.statusText ?? "Редактор закрыт")

editor?.history.selectStep(at: 1)
print(editor?.statusText ?? "Редактор закрыт")

editor?.saveToCloud()
editor?.toolbar.tapUndo()
print(editor?.statusText ?? "Редактор закрыт")

editor = nil
lifecycleLog.append("Синхронизация с облаком")
for line in cloudSync.uploadAll() {
    print(line)
}
for entry in lifecycleLog {
    print(entry)
}
```

## @output
```
Применено: Виньетка
Возврат к шагу 2
Отменено: Контраст +5
IMG_2041.jpg, правок: 2
Редактор закрыт: IMG_2041.jpg
Панель инструментов освобождена
История правок освобождена
Обработчик фото освобождён
Синхронизация с облаком
```

## @tests
```swift
let __t_sync = CloudSync()
let __t_allParts = ["История правок освобождена", "Обработчик фото освобождён", "Панель инструментов освобождена"]

// Каждая связь по отдельности: остальные связи проверка убирает сама
lifecycleLog = []
do {
    let __t_editor = PhotoEditorScreen(fileName: "IMG_3101.jpg", sync: __t_sync)
    __t_editor.history.delegate = nil
    __t_editor.processor.onComplete = nil
}
__ok("Панель инструментов не держит редактор", lifecycleLog.contains("Редактор закрыт: IMG_3101.jpg"), hint: "Toolbar держит редактор через свойство editor, а редактор держит панель. Обратная ссылка на владельца должна быть слабой: weak var editor")

lifecycleLog = []
do {
    let __t_editor = PhotoEditorScreen(fileName: "IMG_3102.jpg", sync: __t_sync)
    __t_editor.toolbar.editor = nil
    __t_editor.processor.onComplete = nil
}
__ok("История правок не держит редактор через делегата", lifecycleLog.contains("Редактор закрыт: IMG_3102.jpg"), hint: "HistoryPanel держит редактор через delegate. Ограничь протокол классами (: AnyObject) и сделай делегата слабым: weak var delegate")

lifecycleLog = []
do {
    let __t_editor = PhotoEditorScreen(fileName: "IMG_3103.jpg", sync: __t_sync)
    __t_editor.toolbar.editor = nil
    __t_editor.history.delegate = nil
}
__ok("Замыкание обработчика не держит редактор", lifecycleLog.contains("Редактор закрыт: IMG_3103.jpg"), hint: "Замыкание onComplete хранится в обработчике, которым владеет редактор, и пишет self. Захвати self слабо: [weak self]")

lifecycleLog = []
do {
    let __t_editor = PhotoEditorScreen(fileName: "IMG_3104.jpg", sync: __t_sync)
    __t_editor.toolbar.editor = nil
    __t_editor.history.delegate = nil
    __t_editor.processor.onComplete = nil
    __t_editor.saveToCloud()
}
__ok("Задача в облачной очереди не держит редактор", lifecycleLog.contains("Редактор закрыт: IMG_3104.jpg"), hint: "Замыкание в saveToCloud хранится в CloudSync, а он живёт дольше редактора. Захвати нужные значения списком захвата, без self")
__eq("Выгрузка после закрытия редактора без правок", __t_sync.uploadAll(), ["IMG_3104.jpg, правок: 0"], hint: "Выгрузка должна состояться и после закрытия редактора: захвати fileName и adjustments списком захвата")

// Полный сценарий: правки, отмена, история, облако
lifecycleLog = []
do {
    let __t_editor = PhotoEditorScreen(fileName: "IMG_3105.jpg", sync: __t_sync)
    __eq("Новый редактор: статус", __t_editor.statusText, "Нет правок")
    __t_editor.apply("Яркость +10")
    __eq("Пока обработка идёт, правка не применена", __t_editor.adjustments, [])
    __t_editor.processor.complete()
    __eq("Правка Яркость +10 применена", __t_editor.statusText, "Применено: Яркость +10", hint: "Замыкание onComplete должно по-прежнему обновлять adjustments, history.steps и statusText")
    __t_editor.apply("Тени -5")
    __t_editor.processor.complete()
    __t_editor.apply("Тёплый тон")
    __t_editor.processor.complete()
    __eq("Три правки в истории", __t_editor.history.steps, ["Яркость +10", "Тени -5", "Тёплый тон"], hint: "После каждой правки history.steps совпадает с adjustments")
    __t_editor.history.selectStep(at: 0)
    __eq("Возврат к первому шагу истории", __t_editor.statusText, "Возврат к шагу 1", hint: "История сообщает о выборе шага делегату: строка history.delegate = self должна остаться в init")
    __eq("После возврата осталась одна правка", __t_editor.adjustments, ["Яркость +10"])
    __t_editor.apply("Резкость +3")
    __t_editor.processor.complete()
    __t_editor.saveToCloud()
    __t_editor.toolbar.tapUndo()
    __eq("Кнопка Отменить на панели инструментов", __t_editor.statusText, "Отменено: Резкость +3", hint: "Панель вызывает undoLastStep() у редактора: строка toolbar.editor = self должна остаться в init")
    __t_editor.toolbar.tapUndo()
    __t_editor.toolbar.tapUndo()
    __eq("Отменять больше нечего", __t_editor.statusText, "Отменять нечего")
}
__eq("После закрытия освобождены редактор и все его части", lifecycleLog.sorted(), __t_allParts + ["Редактор закрыт: IMG_3105.jpg"], hint: "Если какой-то строки нет, этот объект утёк. Проверь все четыре места: toolbar.editor, history.delegate, замыкание onComplete и замыкание в saveToCloud")
__eq("В облако ушло число правок на момент сохранения, а не на момент выгрузки", __t_sync.uploadAll(), ["IMG_3105.jpg, правок: 2"], hint: "Количество правок нужно запомнить при вызове saveToCloud(): захвати adjustments списком захвата")

// Части редактора пережили его самого
lifecycleLog = []
var __t_keptHistory: HistoryPanel? = nil
var __t_keptProcessor: ImageProcessor? = nil
do {
    let __t_editor = PhotoEditorScreen(fileName: "IMG_3106.jpg", sync: __t_sync)
    __t_keptHistory = __t_editor.history
    __t_keptProcessor = __t_editor.processor
    __t_editor.apply("Контраст +5")
    __t_editor.processor.complete()
    __t_editor.apply("Виньетка")
}
__ok("Редактор закрыт, хотя история и обработчик ещё живы", lifecycleLog.contains("Редактор закрыт: IMG_3106.jpg"), hint: "Ни история, ни обработчик не должны держать редактор")
__ok("После закрытия редактора у истории нет делегата", __t_keptHistory?.delegate == nil)
__t_keptHistory?.selectStep(at: 0)
__t_keptProcessor?.complete()
__pass("История и обработчик работают после закрытия редактора без падений")
__t_keptHistory = nil
__t_keptProcessor = nil
__eq("Последние ссылки убраны: всё освобождено", lifecycleLog.sorted(), __t_allParts + ["Редактор закрыт: IMG_3106.jpg"])
```

## @rules
- must: /\b(?:weak|unowned)\s+var\s+editor\b/ :: Панель инструментов не владеет редактором: объяви `weak var editor: PhotoEditorScreen?`.
- must: /\bprotocol\s+HistoryPanelDelegate\s*:\s*(?:[\w\s,&]*\b)?AnyObject\b/ :: Ограничь протокол делегата классами: `protocol HistoryPanelDelegate: AnyObject`.
- must: /\bweak\s+var\s+delegate\b/ :: Делегат истории должен быть слабым: `weak var delegate: HistoryPanelDelegate?`.
- must: /onComplete\s*=\s*\{\s*\[\s*weak\s+self\s*\]/ :: Захвати `self` слабо в замыкании `processor.onComplete`: `{ [weak self] adjustment in`.
- mustnot: /sync\.enqueue\s*\{[^}]*\bself\b/ :: В замыкании для облака не должно быть `self`: захвати `fileName` и `adjustments` списком захвата.

## @hint1
Иди от редактора и ищи всех, кто ссылается на него.

Первое место — панель инструментов. В `init` редактора написано `toolbar.editor = self`, а редактор держит панель в `let toolbar`. Панель — часть редактора и не владеет им. Её ссылку на редактор сделай слабой.

Второе — история правок. `history.delegate = self` — классический делегат. Сделай его слабым, а протокол ограничь классами, иначе Swift не разрешит `weak`.

Третье — замыкание `processor.onComplete`. Оно хранится в обработчике, которым владеет редактор, и обращается к `self`. Захвати `self` слабо и разверни его в начале. Без редактора обновлять нечего, так что в `else` достаточно выйти.

Четвёртое — замыкание в `saveToCloud()`. Его хранит `CloudSync`, который живёт дольше редактора. Здесь `[weak self]` не подойдёт: выгрузка должна состояться и после закрытия. Захвати списком захвата сами значения — имя файла и массив правок.

## @hint2
Четыре инструмента, по одному на каждое место:

```swift
weak var owner: AlbumScreen?

protocol UploadDelegate: AnyObject { ... }
weak var delegate: UploadDelegate?

service.onFinish = { [weak self] result in
    guard let self else {
        return
    }
    self.status = result
}

queue.add { [title, count] in
    "\(title): \(count)"
}
```

Подумай, какой из них подходит панели, какой — истории, какой — обработчику, а какой — облаку.

## @hint3
Три места исправлены, осталось заполнить пропуски:

```swift
// в классе Toolbar
weak var editor: PhotoEditorScreen?

// протокол и делегат истории
protocol HistoryPanelDelegate: AnyObject {
    func historyPanel(_ panel: HistoryPanel, didSelectStep index: Int)
}
weak var delegate: HistoryPanelDelegate?

// в init редактора
processor.onComplete = { [___] adjustment in
    guard let self else {
        return
    }
    self.adjustments.append(adjustment)
    self.history.steps = self.adjustments
    self.statusText = "Применено: \(adjustment)"
}

// в saveToCloud()
sync.enqueue { [___] in
    return "\(fileName), правок: \(adjustments.count)"
}
```

В первом пропуске — слабый захват редактора. Во втором — два имени через запятую: имя файла и массив правок.

## @hint4
Вот готовое решение:

{{solution}}

**Панель инструментов.** Редактор держит панель (`let toolbar`), панель держала редактор (`toolbar.editor = self`). Это цикл владельца и его части. Часть не владеет владельцем, поэтому `weak var editor`. Если редактора уже нет, `editor?.undoLastStep()` просто ничего не сделает.

**История правок.** Та же схема, но через делегата. `weak var delegate` разрывает цикл, а `: AnyObject` у протокола нужен, чтобы `weak` вообще разрешили: слабо можно ссылаться только на объекты классов.

**Обработчик.** Редактор держит обработчик, обработчик хранит замыкание, замыкание держало редактор через `self`. `[weak self]` убирает последнее звено. `guard let self` в начале: если редактор закрыт, правку применять некуда, и замыкание выходит.

**Облако.** Здесь цикла нет, но `CloudSync` живёт дольше редактора, и замыкание с `self` не давало редактору освободиться до выгрузки. К тому же оно читало `adjustments` в момент выгрузки, а пользователь успевал отменить правку. Список захвата `[fileName, adjustments]` копирует строку и массив при вызове `saveToCloud()`. Редактор не захвачен вовсе, а выгрузка знает всё, что ей нужно.

**Почему именно так.** Каждый способ отвечает на свой вопрос. Кто владеет объектом? Владелец держит сильно, остальные слабо. Нужен ли объект, когда замыкание сработает? Если без него делать нечего — `[weak self]`. Если работа должна выполниться в любом случае — захвати значения.

**Типичные ошибки:**

- исправлены три места из четырёх — профилировщик, как и проверка, покажет, что редактор всё ещё в памяти;
- `[weak self]` в `saveToCloud()` — утечки нет, но после закрытия редактора выгрузка не состоится;
- `unowned` для делегата или замыкания — проверка закрывает редактор раньше, чем обработчик сообщает о завершении, и программа упадёт;
- удалена строка `history.delegate = self` — утечки нет, но возврат к шагу истории перестал работать.
