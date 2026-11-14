---
title: Слабая или бесхозная
concept: Ссылки weak и unowned и как выбрать между ними
---

## @description

### Контекст
В редакторе «Кадра» у каждого открытого фото есть документ: сам снимок и слои поверх него — яркость, подпись, рамка. Слой знает свой документ: панели слоёв нужно показывать полное имя вроде «Закат на море / Подпись». А ещё есть очередь экспорта: пользователь нажимает «Сохранить в PNG», и задача ждёт своей очереди.

Тикет: «Закрытые документы не освобождаются. А если закрыть документ, пока экспорт в очереди, он всё равно экспортируется». Тимлид объясняет: «Документ и слои держат друг друга — это цикл. А задача экспорта держит документ сильной ссылкой и не даёт ему исчезнуть. Ручной `close()` тут не нужен. Возьми правильные виды ссылок».

### Новое в Swift
В прошлой задаче цикл разрывали вручную. Надёжнее сделать так, чтобы одна из ссылок **вообще не увеличивала счётчик**. Для этого в Swift есть два слова: `weak` и `unowned`.

**`weak` — слабая ссылка.** Она указывает на объект, но не держит его. Когда объект исчезает, Swift сам кладёт в слабую ссылку `nil`. Поэтому слабая ссылка всегда опционал. Обычно её объявляют через `var`:

```swift
class PreviewScreen {
    let fileName: String

    init(fileName: String) {
        self.fileName = fileName
    }

    deinit {
        print("Превью закрыто")
    }
}

class ShareSheet {
    weak var preview: PreviewScreen?
}

let sheet = ShareSheet()
var preview: PreviewScreen? = PreviewScreen(fileName: "IMG_0007.jpg")   // счётчик: 1
sheet.preview = preview        // всё ещё 1: слабая ссылка не считается
preview = nil                  // счётчик: 0, "Превью закрыто"
print(sheet.preview == nil)    // true: Swift сам положил nil
```

Объект за слабой ссылкой может исчезнуть в любой момент. Поэтому перед работой его разворачивают, как любой опционал:

```swift
func shareTitle(of sheet: ShareSheet) -> String {
    guard let preview = sheet.preview else {
        return "Нечего отправлять"
    }
    // здесь preview - обычная сильная ссылка до конца функции
    return "Отправка: \(preview.fileName)"
}
```

**`unowned` — бесхозная ссылка.** Она тоже не увеличивает счётчик, но она **не опционал** и не становится `nil`. Ею пользуются как обычной ссылкой, без развёртки. Цена удобства — обещание: «объект, на который я указываю, живёт не меньше меня».

```swift
class Collage {
    var cells: [CollageCell] = []
}

class CollageCell {
    unowned let collage: Collage    // ячейка не существует без коллажа

    init(collage: Collage) {
        self.collage = collage
    }
}
```

Коллаж держит ячейки сильно, ячейки ссылаются на коллаж бесхозно. Цикла нет. Ячейка живёт внутри коллажа, значит, коллаж точно не исчезнет раньше неё.

> ⚠️ Если обещание нарушено и объект за `unowned` уже исчез, программа упадёт при первом же обращении:
> `Fatal error: Attempted to read an unowned reference but object was already deallocated`.
> Например, кто-то сохранил ячейку в отдельную переменную, коллаж закрыли, а потом спросили `cell.collage.cells.count`. С `weak` в такой ситуации было бы просто `nil`.

**Как выбрать:**

| Ситуация | Ссылка |
|---|---|
| Владелец держит то, чем владеет | обычная, сильная |
| Объект может исчезнуть раньше того, кто на него ссылается | `weak` |
| Объект точно живёт дольше, без него ссылающийся не имеет смысла | `unowned` |
| Сомневаешься | `weak` — безопаснее |

`weak` подходит не только для циклов. Если объект просто не должен продлевать чужую жизнь, ссылка тоже слабая.

### Задача
В редакторе три класса: `PhotoDocument` (документ), `Layer` (слой) и `ExportJob` (задача экспорта). Сейчас все ссылки сильные.

1. В классе `Layer` сделай ссылку `document` бесхозной: `unowned let document: PhotoDocument`. Слой живёт внутри документа, и без документа он не нужен.
2. В классе `ExportJob` сделай ссылку `document` слабой: `weak var document: PhotoDocument?`. Пользователь может закрыть документ раньше, чем дойдёт очередь.
3. Перепиши метод `run() -> String` в `ExportJob`:
   - если документ ещё открыт — верни `Экспорт: <название> в <формат>, слоёв: <число слоёв>`;
   - если документ уже исчез — верни `Экспорт в <формат> отменён: документ закрыт`.

`fullName()` у слоя и `init` у классов не меняй.

### Пример
```swift
let doc = PhotoDocument(title: "Портрет")
doc.addLayer(named: "Ретушь")
doc.layers[0].fullName()                    // "Портрет / Ретушь"

let job = ExportJob(document: doc, format: "JPEG")
job.run()                                   // "Экспорт: Портрет в JPEG, слоёв: 1"
// ...документ закрыли, ссылок на него не осталось...
job.run()                                   // "Экспорт в JPEG отменён: документ закрыт"
```

Сценарий из редактора должен вывести:

```text
Закат на море / Подпись
Экспорт: Закат на море в PNG, слоёв: 2
Экспорт в PNG отменён: документ закрыт
Документ закрыт: Закат на море
Слой удалён: Яркость
Слой удалён: Подпись
```

## @starter
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Документ: фото и слои поверх него. Документ владеет своими слоями
class PhotoDocument {
    let title: String
    var layers: [Layer] = []

    init(title: String) {
        self.title = title
    }

    func addLayer(named name: String) {
        layers.append(Layer(name: name, document: self))
    }

    deinit {
        lifecycleLog.append("Документ закрыт: \(title)")
    }
}

// Слой. Существует только внутри своего документа
class Layer {
    let name: String
    // 1. Сделай эту ссылку бесхозной (unowned)
    let document: PhotoDocument

    init(name: String, document: PhotoDocument) {
        self.name = name
        self.document = document
    }

    // Полное имя для панели слоёв
    func fullName() -> String {
        return "\(document.title) / \(name)"
    }

    deinit {
        lifecycleLog.append("Слой удалён: \(name)")
    }
}

// Задача экспорта в очереди. Документ могут закрыть раньше, чем до неё дойдёт очередь
class ExportJob {
    let format: String
    // 2. Сделай эту ссылку слабой (weak)
    let document: PhotoDocument

    init(document: PhotoDocument, format: String) {
        self.document = document
        self.format = format
    }

    // 3. Перепиши: если документа уже нет, экспорт отменяется
    func run() -> String {
        return "Экспорт: \(document.title) в \(format), слоёв: \(document.layers.count)"
    }
}

// Сценарий из тикета
var document: PhotoDocument? = PhotoDocument(title: "Закат на море")
document?.addLayer(named: "Яркость")
document?.addLayer(named: "Подпись")

var exportJob: ExportJob?
if let openDocument = document {
    print(openDocument.layers[1].fullName())
    exportJob = ExportJob(document: openDocument, format: "PNG")
}
print(exportJob?.run() ?? "Нет задачи")

// Пользователь закрывает документ, не дождавшись экспорта
document = nil
print(exportJob?.run() ?? "Нет задачи")

for entry in lifecycleLog {
    print(entry)
}
```

## @solution
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Документ: фото и слои поверх него. Документ владеет своими слоями
class PhotoDocument {
    let title: String
    var layers: [Layer] = []

    init(title: String) {
        self.title = title
    }

    func addLayer(named name: String) {
        layers.append(Layer(name: name, document: self))
    }

    deinit {
        lifecycleLog.append("Документ закрыт: \(title)")
    }
}

// Слой. Существует только внутри своего документа
class Layer {
    let name: String
    // 1. Сделай эту ссылку бесхозной (unowned)
    unowned let document: PhotoDocument

    init(name: String, document: PhotoDocument) {
        self.name = name
        self.document = document
    }

    // Полное имя для панели слоёв
    func fullName() -> String {
        return "\(document.title) / \(name)"
    }

    deinit {
        lifecycleLog.append("Слой удалён: \(name)")
    }
}

// Задача экспорта в очереди. Документ могут закрыть раньше, чем до неё дойдёт очередь
class ExportJob {
    let format: String
    // 2. Сделай эту ссылку слабой (weak)
    weak var document: PhotoDocument?

    init(document: PhotoDocument, format: String) {
        self.document = document
        self.format = format
    }

    // 3. Перепиши: если документа уже нет, экспорт отменяется
    func run() -> String {
        guard let document else {
            return "Экспорт в \(format) отменён: документ закрыт"
        }
        return "Экспорт: \(document.title) в \(format), слоёв: \(document.layers.count)"
    }
}

// Сценарий из тикета
var document: PhotoDocument? = PhotoDocument(title: "Закат на море")
document?.addLayer(named: "Яркость")
document?.addLayer(named: "Подпись")

var exportJob: ExportJob?
if let openDocument = document {
    print(openDocument.layers[1].fullName())
    exportJob = ExportJob(document: openDocument, format: "PNG")
}
print(exportJob?.run() ?? "Нет задачи")

// Пользователь закрывает документ, не дождавшись экспорта
document = nil
print(exportJob?.run() ?? "Нет задачи")

for entry in lifecycleLog {
    print(entry)
}
```

## @output
```
Закат на море / Подпись
Экспорт: Закат на море в PNG, слоёв: 2
Экспорт в PNG отменён: документ закрыт
Документ закрыт: Закат на море
Слой удалён: Яркость
Слой удалён: Подпись
```

## @tests
```swift
// Узнаём, опциональная ли ссылка, не обращаясь к самому объекту
func __t_isOptional<T>(_ path: KeyPath<ExportJob, T?>) -> Bool { return true }
func __t_isOptional<T>(_ path: KeyPath<ExportJob, T>) -> Bool { return false }

// Документ со слоями освобождается без всякого close()
lifecycleLog = []
do {
    let __t_doc = PhotoDocument(title: "Котики")
    __t_doc.addLayer(named: "Рамка")
    __t_doc.addLayer(named: "Текст")
    __eq("Полное имя слоя Рамка", __t_doc.layers[0].fullName(), "Котики / Рамка", hint: "fullName() менять не нужно: он берёт название из document.title")
    __ok("Слой ссылается на свой документ", __t_doc.layers[1].document === __t_doc, hint: "В init слоя ссылка на документ должна сохраняться, как раньше")
}
__eq("Документ Котики и два его слоя освобождены", lifecycleLog.sorted(), ["Документ закрыт: Котики", "Слой удалён: Рамка", "Слой удалён: Текст"], hint: "Документ держит слои, а слои держат документ: это цикл. Сделай ссылку слоя на документ бесхозной: unowned let document")

if __t_isOptional(\ExportJob.document) {
    // Задача экспорта не держит документ без слоёв
    lifecycleLog = []
    var __t_job: ExportJob? = nil
    do {
        let __t_doc = PhotoDocument(title: "Пустой холст")
        let __t_created = ExportJob(document: __t_doc, format: "JPEG")
        __t_job = __t_created
        __eq("Документ открыт: экспорт пустого холста", __t_created.run(), "Экспорт: Пустой холст в JPEG, слоёв: 0", hint: "Если документ на месте, верни: Экспорт: название в формат, слоёв: число")
    }
    __eq("Задача в очереди не продлевает жизнь закрытого документа", lifecycleLog, ["Документ закрыт: Пустой холст"], hint: "ExportJob не владеет документом: ссылка должна быть weak")
    __ok("После закрытия документа ссылка в задаче стала nil", __t_job?.document == nil)
    __eq("Документ закрыт: экспорт в JPEG отменён", __t_job?.run() ?? "", "Экспорт в JPEG отменён: документ закрыт", hint: "Разверни слабую ссылку через guard let или if let. Если документа нет, верни: Экспорт в формат отменён: документ закрыт")

    // Документ со слоями и задачей экспорта
    lifecycleLog = []
    var __t_queued: ExportJob? = nil
    do {
        let __t_doc = PhotoDocument(title: "Отпуск 2025")
        __t_doc.addLayer(named: "Яркость")
        __t_doc.addLayer(named: "Контраст")
        __t_doc.addLayer(named: "Подпись")
        let __t_created = ExportJob(document: __t_doc, format: "HEIC")
        __t_queued = __t_created
        __eq("Документ с тремя слоями: экспорт в HEIC", __t_created.run(), "Экспорт: Отпуск 2025 в HEIC, слоёв: 3", hint: "Число слоёв берётся из document.layers.count")
        __eq("Повторный запуск, пока документ открыт, даёт тот же результат", __t_created.run(), "Экспорт: Отпуск 2025 в HEIC, слоёв: 3")
    }
    __ok("Документ Отпуск 2025 освобождён, хотя задача ещё в очереди", lifecycleLog.contains("Документ закрыт: Отпуск 2025"), hint: "Документ держат слои или задача экспорта. Слою нужен unowned, задаче - weak")
    __eq("Все три слоя удалены вместе с документом", lifecycleLog.filter { $0.hasPrefix("Слой удалён") }.count, 3)
    __eq("Документ Отпуск 2025 закрыт: экспорт в HEIC отменён", __t_queued?.run() ?? "", "Экспорт в HEIC отменён: документ закрыт", hint: "Формат в тексте отмены берётся из свойства format")
} else {
    __fail("Ссылка document в ExportJob - слабая и опциональная", "Объяви её так: weak var document: PhotoDocument? Документ могут закрыть раньше, чем дойдёт очередь, и тогда в ссылке окажется nil")
}
```

## @rules
- must: /\bunowned\s+(?:let|var)\s+document\b/ :: В классе `Layer` объяви ссылку на документ бесхозной: `unowned let document: PhotoDocument`.
- must: /\bweak\s+(?:var|let)\s+document\s*:\s*PhotoDocument\s*\?/ :: В классе `ExportJob` объяви ссылку на документ слабой: `weak var document: PhotoDocument?`.

## @hint1
Начни со слоя. Слой живёт внутри документа: документ держит его в массиве `layers`. Значит, документ никогда не исчезнет раньше своего слоя. Это как раз случай для бесхозной ссылки: допиши слово `unowned` перед `let` в объявлении `document`. Больше в слое ничего менять не нужно: `fullName()` работает с бесхозной ссылкой так же, как с обычной.

Теперь задача экспорта. Документ могут закрыть, пока задача ждёт очереди, — значит, нужна слабая ссылка. У неё три отличия от нынешней: слово `weak` впереди, `var` вместо `let` и знак вопроса после типа.

После этого Swift сообщит об ошибке в `run()`: документ теперь опционал, и его нельзя использовать напрямую. Разверни его в начале метода через `guard let`. В ветке `else` верни текст об отмене — в нём есть только формат. После `guard` останется прежняя строка с названием и количеством слоёв.

## @hint2
Так объявляют бесхозную и слабую ссылки:

```swift
unowned let collage: Collage
weak var preview: PreviewScreen?
```

А так безопасно работают со слабой ссылкой внутри метода — её разворачивают, а если объекта нет, сразу выходят:

```swift
guard let preview = sheet.preview else {
    return "Нечего отправлять"
}
```

Внутри класса можно написать короче: `guard let document else { ... }` — так ты уже делала с опционалами.

## @hint3
Объявления готовы, осталось дописать `run()`:

```swift
// в классе Layer
unowned let document: PhotoDocument

// в классе ExportJob
weak var document: PhotoDocument?

func run() -> String {
    guard let ___ else {
        return "Экспорт в \(___) отменён: документ закрыт"
    }
    return "Экспорт: \(document.title) в \(format), слоёв: \(document.layers.count)"
}
```

В первом пропуске — имя слабой ссылки, которую нужно развернуть. Во втором — свойство с форматом экспорта.

## @hint4
Вот готовое решение:

{{solution}}

**Слой и `unowned`.** Документ держит слои в массиве `layers`, а слой раньше держал документ. Получался цикл: после `document = nil` счётчик документа оставался больше нуля из-за слоёв. Теперь ссылка слоя бесхозная и не считается. Когда исчезает последняя внешняя ссылка, документ освобождается, а за ним по цепочке и его слои. Бесхозная ссылка здесь безопасна: слой живёт внутри документа и не может его пережить. И пользоваться ею удобно — в `fullName()` не нужна никакая развёртка.

**Задача экспорта и `weak`.** Здесь цикла нет: документ не держит задачу. Но сильная ссылка продлевала документу жизнь: закрытый документ оставался в памяти и всё равно экспортировался. Слабая ссылка не мешает документу исчезнуть, а Swift сам кладёт в неё `nil`. Поэтому `run()` сначала проверяет, жив ли документ.

**Почему не `unowned` для экспорта.** Задача в очереди может пережить документ — так и было в сценарии. Обращение к исчезнувшему объекту через `unowned` роняет программу. Со `weak` вместо падения получается `nil` и спокойное «Экспорт отменён».

**Почему `guard let document`.** Короткая форма разворачивает свойство `document` в константу с тем же именем. Ниже `guard` это уже обычная сильная ссылка: пока работает `run()`, документ точно не исчезнет. Поэтому строку результата не пришлось менять.

**Типичные ошибки:**

- вместо развёртки написано `document?.title ?? ""` — при закрытом документе получится странный текст «Экспорт:  в PNG, слоёв: 0» вместо отмены;
- `weak var document: PhotoDocument` без знака вопроса — слабая ссылка всегда опционал;
- `document!.title` вместо развёртки — при закрытом документе программа упадёт так же, как с `unowned`;
- `unowned` для задачи экспорта — работает, пока документ открыт, и падает, как только его закрыли.
