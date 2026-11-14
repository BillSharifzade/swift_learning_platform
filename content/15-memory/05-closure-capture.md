---
title: Замыкание держит экран
concept: Захват self в хранимом замыкании и список захвата [weak self]
---

## @description

### Контекст
На экране фильтров пользователь выбирает «Сепию» или «Винтаж», и `FilterRenderer` накладывает фильтр на фото. Обработка идёт не мгновенно: обработчик сообщает о прогрессе и о завершении через замыкания `onProgress` и `onFinish`. Это те самые обработчики-completion, которые ты хранила в «Ярмарке».

Тикет: «После закрытия экрана фильтров память не освобождается». Тимлид: «Делегата тут нет, но цикл тот же самый — через замыкание. Почини `onProgress` и допиши `onFinish`, его так и не сделали. Только сразу без утечки».

### Новое в Swift
Ты уже знаешь: замыкание **захватывает** то, чем пользуется, — переменные снаружи становятся частью замыкания. Если замыкание написано в методе класса и обращается к свойствам через `self.`, оно захватывает сам объект. И держит его **сильной ссылкой**.

Пока замыкание вызывается сразу и исчезает, это не страшно. Беда начинается, когда замыкание **сохраняют** в объекте, которым владеет `self`:

```swift
class BackupScreen {
    let backup = CloudBackup()          // экран держит сервис
    var statusText = ""

    func startBackup() {
        backup.onComplete = { count in  // сервис держит замыкание
            self.statusText = "Сохранено фото: \(count)"   // замыкание держит экран
        }
    }
}
```

Экран → сервис → замыкание → экран. Это цикл, как в прошлых задачах, только одно из звеньев — замыкание. Кстати, именно поэтому Swift требует писать `self.` внутри таких замыканий: чтобы ты заметила захват и подумала о цикле.

**Список захвата.** Перед параметрами замыкания можно написать в квадратных скобках, **как** захватить значения. Запись `[weak self]` значит «захвати `self` слабой ссылкой»:

```swift
backup.onComplete = { [weak self] count in
    self?.statusText = "Сохранено фото: \(count)"
}
```

Теперь замыкание не держит экран. Внутри замыкания `self` стал опционалом: к моменту вызова экран могли закрыть. Поэтому обращаться к нему нужно через `?.`, как к любому опционалу.

Если строк внутри много, удобнее развернуть `self` один раз в начале:

```swift
backup.onComplete = { [weak self] count in
    guard let self else {
        return                      // экрана уже нет - делать нечего
    }
    self.statusText = "Сохранено фото: \(count)"
    self.lastBackupCount = count
}
```

После `guard let self` до конца замыкания `self` снова обычная сильная ссылка. Экран точно не исчезнет посреди работы замыкания.

Посчитаем ссылки после исправления. Сильная ссылка на экран одна — от переменной, в которой он лежит. Экран держит сервис, сервис держит замыкание, а замыкание держит экран только слабо. Закрыли экран — его счётчик стал нулём. Экран освободился и отпустил сервис, а с ним и замыкание.

**Когда `[weak self]` не нужен.** Если замыкание выполняется сразу и не сохраняется — `filter`, `map`, `sorted(by:)`, `forEach` — цикла не будет. Слабый захват нужен для замыканий, которые где-то **хранятся**: обработчики завершения, реакции на события, колбэки.

> ⚠️ Бывает ещё `[unowned self]`. Он тоже не держит объект, и `self` в нём не опционал. Но если замыкание вызовут после того, как экран исчез, программа упадёт. Обработчик может пережить экран, поэтому в таких местах безопаснее `[weak self]`.

### Задача
В редакторе обработчик `FilterRenderer` (его не меняй) и экран `FilterScreen`.

1. Нажми «Проверить», ничего не меняя. Экран не освобождается: замыкание `onProgress` держит его через `self`.
2. В методе `applyFilter(named:)` исправь замыкание `onProgress`: захвати `self` слабо. По-прежнему оно записывает в `progressText` строку `Обработка: N%`.
3. Там же допиши замыкание `onFinish` — тоже со слабым `self`. Оно получает готовое сообщение и:
   - записывает его в `statusText`;
   - добавляет название фильтра в конец массива `appliedFilters`.

Строка `renderer.start(filter: name)` должна остаться последней в методе.

### Пример
```swift
let screen = FilterScreen(photoName: "IMG_7777.jpg")
screen.applyFilter(named: "Винтаж")
screen.progressText              // "Обработка: 0%"
screen.renderer.reportProgress(40)
screen.progressText              // "Обработка: 40%"
screen.renderer.finish()
screen.statusText                // "Фильтр Винтаж применён"
screen.appliedFilters            // ["Винтаж"]
```

Сценарий из редактора должен вывести:

```text
Обработка: 60%
Фильтр Сепия применён
Экран фильтров закрыт: IMG_2041.jpg
Обработчик фильтров освобождён
```

## @starter
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Обработчик фильтров. О прогрессе и завершении сообщает через замыкания
class FilterRenderer {
    var onProgress: ((Int) -> Void)?
    var onFinish: ((String) -> Void)?
    var currentFilter = ""

    func start(filter: String) {
        currentFilter = filter
        onProgress?(0)
    }

    // Обработка продвинулась на percent процентов
    func reportProgress(_ percent: Int) {
        onProgress?(percent)
    }

    // Фильтр наложен
    func finish() {
        onFinish?("Фильтр \(currentFilter) применён")
    }

    deinit {
        lifecycleLog.append("Обработчик фильтров освобождён")
    }
}

// Экран фильтров. Владеет обработчиком
class FilterScreen {
    let photoName: String
    let renderer = FilterRenderer()
    var progressText = ""
    var statusText = "Выберите фильтр"
    var appliedFilters: [String] = []

    init(photoName: String) {
        self.photoName = photoName
    }

    func applyFilter(named name: String) {
        // 2. Это замыкание держит экран. Захвати self слабо
        renderer.onProgress = { percent in
            self.progressText = "Обработка: \(percent)%"
        }

        // 3. Допиши onFinish: сообщение - в statusText, name - в appliedFilters

        renderer.start(filter: name)
    }

    deinit {
        lifecycleLog.append("Экран фильтров закрыт: \(photoName)")
    }
}

// Сценарий из тикета
var filterScreen: FilterScreen? = FilterScreen(photoName: "IMG_2041.jpg")
filterScreen?.applyFilter(named: "Сепия")
filterScreen?.renderer.reportProgress(60)
print(filterScreen?.progressText ?? "Экран закрыт")
filterScreen?.renderer.finish()
print(filterScreen?.statusText ?? "Экран закрыт")

filterScreen = nil
for entry in lifecycleLog {
    print(entry)
}
```

## @solution
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Обработчик фильтров. О прогрессе и завершении сообщает через замыкания
class FilterRenderer {
    var onProgress: ((Int) -> Void)?
    var onFinish: ((String) -> Void)?
    var currentFilter = ""

    func start(filter: String) {
        currentFilter = filter
        onProgress?(0)
    }

    // Обработка продвинулась на percent процентов
    func reportProgress(_ percent: Int) {
        onProgress?(percent)
    }

    // Фильтр наложен
    func finish() {
        onFinish?("Фильтр \(currentFilter) применён")
    }

    deinit {
        lifecycleLog.append("Обработчик фильтров освобождён")
    }
}

// Экран фильтров. Владеет обработчиком
class FilterScreen {
    let photoName: String
    let renderer = FilterRenderer()
    var progressText = ""
    var statusText = "Выберите фильтр"
    var appliedFilters: [String] = []

    init(photoName: String) {
        self.photoName = photoName
    }

    func applyFilter(named name: String) {
        // 2. Это замыкание держит экран. Захвати self слабо
        renderer.onProgress = { [weak self] percent in
            self?.progressText = "Обработка: \(percent)%"
        }

        // 3. Допиши onFinish: сообщение - в statusText, name - в appliedFilters
        renderer.onFinish = { [weak self] message in
            guard let self else {
                return
            }
            self.statusText = message
            self.appliedFilters.append(name)
        }

        renderer.start(filter: name)
    }

    deinit {
        lifecycleLog.append("Экран фильтров закрыт: \(photoName)")
    }
}

// Сценарий из тикета
var filterScreen: FilterScreen? = FilterScreen(photoName: "IMG_2041.jpg")
filterScreen?.applyFilter(named: "Сепия")
filterScreen?.renderer.reportProgress(60)
print(filterScreen?.progressText ?? "Экран закрыт")
filterScreen?.renderer.finish()
print(filterScreen?.statusText ?? "Экран закрыт")

filterScreen = nil
for entry in lifecycleLog {
    print(entry)
}
```

## @output
```
Обработка: 60%
Фильтр Сепия применён
Экран фильтров закрыт: IMG_2041.jpg
Обработчик фильтров освобождён
```

## @tests
```swift
// Экран работает как раньше
lifecycleLog = []
do {
    let __t_screen = FilterScreen(photoName: "IMG_7777.jpg")
    __t_screen.applyFilter(named: "Винтаж")
    __eq("Сразу после запуска фильтра прогресс 0%", __t_screen.progressText, "Обработка: 0%", hint: "Замыкание onProgress по-прежнему записывает в progressText строку Обработка: N%")
    __t_screen.renderer.reportProgress(40)
    __eq("Прогресс 40%", __t_screen.progressText, "Обработка: 40%")
    __eq("Пока фильтр не готов, статус прежний", __t_screen.statusText, "Выберите фильтр", hint: "statusText меняется только в onFinish")
    __t_screen.renderer.finish()
    __eq("Фильтр Винтаж готов: статус", __t_screen.statusText, "Фильтр Винтаж применён", hint: "В onFinish запиши в statusText сообщение, которое пришло в замыкание")
    __eq("Винтаж попал в список применённых", __t_screen.appliedFilters, ["Винтаж"], hint: "В onFinish добавь название фильтра (параметр name метода applyFilter) в appliedFilters")
    __t_screen.applyFilter(named: "Нуар")
    __t_screen.renderer.finish()
    __eq("Второй фильтр: статус", __t_screen.statusText, "Фильтр Нуар применён")
    __eq("Оба фильтра в списке по порядку", __t_screen.appliedFilters, ["Винтаж", "Нуар"], hint: "Каждый готовый фильтр добавляется в конец appliedFilters")
}
__eq("Экран закрыт после двух фильтров: освобождены экран и обработчик", lifecycleLog.sorted(), ["Обработчик фильтров освобождён", "Экран фильтров закрыт: IMG_7777.jpg"], hint: "Замыкания хранятся в обработчике, которым владеет экран. Если замыкание захватывает self сильно, получается цикл. Напиши [weak self] в обоих замыканиях")

// Экран закрыли, не дождавшись конца обработки
lifecycleLog = []
do {
    let __t_screen = FilterScreen(photoName: "IMG_8888.jpg")
    __t_screen.applyFilter(named: "Сепия")
    __t_screen.renderer.reportProgress(10)
}
__eq("Экран закрыт посреди обработки: всё освобождено", lifecycleLog.sorted(), ["Обработчик фильтров освобождён", "Экран фильтров закрыт: IMG_8888.jpg"], hint: "Проверь оба замыкания: onProgress и onFinish должны захватывать self слабо: [weak self]")

// Обработчик пережил экран
lifecycleLog = []
var __t_keptRenderer: FilterRenderer? = nil
do {
    let __t_screen = FilterScreen(photoName: "IMG_9999.jpg")
    __t_keptRenderer = __t_screen.renderer
    __t_screen.applyFilter(named: "Винтаж")
}
__eq("Обработчик ещё жив, а закрытый экран освобождён", lifecycleLog, ["Экран фильтров закрыт: IMG_9999.jpg"], hint: "Замыкания в обработчике не должны держать экран: [weak self]")
__t_keptRenderer?.reportProgress(90)
__t_keptRenderer?.finish()
__pass("Обработка закончилась после закрытия экрана - ничего не сломалось")
__t_keptRenderer = nil
__eq("Обработчик освобождён, когда исчезла последняя ссылка", lifecycleLog, ["Экран фильтров закрыт: IMG_9999.jpg", "Обработчик фильтров освобождён"])
```

## @rules
- must: /\[\s*weak\s+self\s*\][\s\S]*\[\s*weak\s+self\s*\]/ :: Захвати `self` слабо в обоих замыканиях — и в `onProgress`, и в `onFinish`: `{ [weak self] ... in`.

## @hint1
Посмотри, кто кого держит. Экран владеет обработчиком через `let renderer`. Обработчик хранит замыкание в `onProgress`. А замыкание пишет `self.progressText`, значит, захватывает экран. Круг замкнулся.

Чтобы разорвать его, замыкание должно держать экран слабо. Для этого сразу после открывающей фигурной скобки замыкания, перед параметром, напиши список захвата со словами `weak self` в квадратных скобках. После этого `self` внутри — опционал. В замыкании одна строка, поэтому удобно поставить вопросительный знак после `self`.

Замыкание `onFinish` пиши сразу правильно: тоже со слабым `self`. Параметр у него — готовое сообщение. Внутри две строки, поэтому удобнее сначала развернуть `self` через `guard let`, а в `else` просто выйти. Потом запиши сообщение в `statusText` и добавь в `appliedFilters` название фильтра — это параметр `name` самого метода `applyFilter`. Замыкание видит его, потому что захватывает.

## @hint2
Так выглядит замыкание со слабым захватом `self`:

```swift
backup.onComplete = { [weak self] count in
    self?.statusText = "Сохранено фото: \(count)"
}
```

А так — с разворачиванием, когда строк внутри несколько:

```swift
backup.onComplete = { [weak self] count in
    guard let self else {
        return
    }
    self.statusText = "Сохранено фото: \(count)"
    self.lastBackupCount = count
}
```

## @hint3
`onProgress` исправлен, заполни пропуски в `onFinish`:

```swift
func applyFilter(named name: String) {
    renderer.onProgress = { [weak self] percent in
        self?.progressText = "Обработка: \(percent)%"
    }

    renderer.onFinish = { [___] message in
        guard let self else {
            return
        }
        self.statusText = ___
        self.appliedFilters.append(___)
    }

    renderer.start(filter: name)
}
```

В первом пропуске — слабый захват экрана. Во втором — параметр замыкания с готовым сообщением. В третьем — параметр метода с названием фильтра.

## @hint4
Вот готовое решение:

{{solution}}

**Где был цикл.** Экран держит обработчик (`let renderer`). Обработчик держит замыкания (`onProgress`, `onFinish`). Замыкание, в котором написано `self.progressText`, держит экран. После `filterScreen = nil` у экрана оставалась ссылка из замыкания, и `deinit` не срабатывал.

**Что делает `[weak self]`.** Список захвата говорит Swift: «`self` захвати слабо». Замыкание помнит экран, но не держит его, и счётчик экрана не растёт. Теперь `filterScreen = nil` убирает единственную сильную ссылку. Экран освобождается, отпускает обработчик, а обработчик — свои замыкания.

**Два способа работы со слабым `self`.** В `onProgress` одна строка, и хватает `self?.`: если экрана нет, присваивание просто не выполнится. В `onFinish` строк две. `guard let self` разворачивает его один раз: если экрана нет — выходим, если есть — дальше `self` обычная сильная ссылка до конца замыкания. Так экран не может исчезнуть между двумя строками.

**Почему `name` можно не захватывать слабо.** `name` — это строка, значение, а не объект. Замыкание хранит её копию, и никакого цикла она не создаёт. Слабо захватывают только объекты классов.

**Почему не `[unowned self]`.** Проверка держит обработчик отдельно, закрывает экран и только потом присылает прогресс и завершение. С `unowned` программа упала бы в этот момент. С `weak` замыкание видит `nil` и спокойно ничего не делает.

**Типичные ошибки:**

- `[weak self]` добавлен только в одно замыкание — второе продолжает держать экран;
- после `[weak self]` оставлено `self.progressText` без `?` — Swift напомнит, что `self` теперь опционал;
- `self!.statusText` — восклицательный знак уронит программу, если экран уже закрыт;
- в `appliedFilters` добавлено `message` вместо `name` — в списке окажется целая фраза, а не название фильтра.
