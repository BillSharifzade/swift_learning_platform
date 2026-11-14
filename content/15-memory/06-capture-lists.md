---
title: Что именно захвачено
concept: Списки захвата — захват значений и ссылок
---

## @description

### Контекст
В «Кадре» есть очередь экспорта. Пользователь выбирает формат и качество, нажимает «В очередь» и продолжает работать. Очередь `ExportQueue` живёт всё время, пока открыто приложение, и выполняет задачи по одной.

В тикете две жалобы. Первая: «Поставила в очередь JPEG с качеством 90, потом сдвинула ползунок на 60 и поставила ещё один. Оба файла вышли с качеством 60». Вторая: «Пока в очереди есть задачи, закрытый редактор висит в памяти». Тимлид: «Обе проблемы в одном замыкании. Оно захватывает `self` целиком и читает настройки в момент выгрузки, а не в момент нажатия. Захвати ровно то, что нужно».

### Новое в Swift
**По умолчанию замыкание захватывает саму переменную**, а не её значение. Оно видит все изменения, которые случились после его создания:

```swift
var brightness = 10
let showBrightness = {
    print("Яркость: \(brightness)")
}
brightness = 25
showBrightness()     // Яркость: 25
```

Замыкание помнит не число 10, а переменную `brightness`. В момент вызова в ней уже 25.

**Список захвата копирует значение в момент создания.** Ты уже писала в квадратных скобках `[weak self]`. В тех же скобках можно перечислить любые имена:

```swift
var brightness = 10
let showBrightness = { [brightness] in
    print("Яркость: \(brightness)")
}
brightness = 25
showBrightness()     // Яркость: 10
```

Теперь `brightness` внутри замыкания — отдельная константа. В неё скопировали 10, когда создавали замыкание. Можно дать копии другое имя: `[startValue = brightness]`.

**Что именно копируется, зависит от типа.** Числа, строки, структуры — значения, и копия от оригинала не зависит. А объект класса передаётся по ссылке. Список захвата копирует **ссылку**, и замыкание работает с тем же самым объектом. Всё, что с ним происходит, замыкание видит. И держит его сильно:

```swift
class UploadCounter {
    var uploaded = 0
}

let counter = UploadCounter()
var caption = "Море"
let upload = { [caption, counter] in
    counter.uploaded += 1
    print("\(counter.uploaded). \(caption)")
}
caption = "Горы"
upload()                    // 1. Море
upload()                    // 2. Море
print(counter.uploaded)     // 2
```

Подпись скопирована как значение — «Горы» замыкание не увидело. А счётчик общий: оба вызова меняли один объект, и снаружи видно 2.

**В методах класса.** Если в замыкании написать `self.quality`, захватывается `self` — сильная ссылка на весь объект, а значение читается в момент вызова. Если перечислить свойства в списке захвата, Swift скопирует их прямо сейчас, а `self` захватывать не будет вовсе:

```swift
func makeCaption() -> () -> String {
    return { [title, photoCount] in
        "\(title): \(photoCount) фото"
    }
}
```

| Запись в замыкании | Что захвачено | Когда читается значение | Держит объект |
|---|---|---|---|
| `self.title` | весь объект | при вызове | да |
| `[weak self]`, потом `self?.title` | объект, слабо | при вызове | нет |
| `[title]`, если это строка или структура | копия значения | при создании | нет |
| `[counter]`, если это объект класса | ссылка на объект | при вызове | держит `counter`, но не `self` |

### Задача
В редакторе структура `ExportSettings`, классы `ExportStats` (счётчик выгрузок), `ExportQueue` (очередь, её не меняй) и `EditorScreen`.

1. Нажми «Проверить», ничего не меняя, и посмотри, какие проверки не прошли.
2. Перепиши метод `scheduleExport()` в `EditorScreen`. Замыкание, которое он ставит в очередь, должно захватывать через список захвата ровно три вещи: `settings`, `fileName` и `stats`. Слова `self` в замыкании быть не должно.
3. Задача из очереди делает то же, что и раньше:
   - увеличивает `stats.exportedCount` на 1;
   - возвращает строку `N. <файл>: <формат>, качество <качество>`, где N — значение счётчика уже после увеличения.

Формат и качество берутся такими, какими они были в момент вызова `scheduleExport()`. А счётчик общий для всех задач одного редактора: первая выполненная задача получает номер 1, вторая — 2.

### Пример
```swift
let queue = ExportQueue()
let screen = EditorScreen(fileName: "IMG_5001.jpg", queue: queue)
screen.scheduleExport()             // JPEG, 90
screen.settings.quality = 60
screen.scheduleExport()             // JPEG, 60
screen.settings.format = "PNG"
queue.runAll()
// ["1. IMG_5001.jpg: JPEG, качество 90", "2. IMG_5001.jpg: JPEG, качество 60"]
screen.stats.exportedCount          // 2
```

Сценарий из редактора должен вывести:

```text
1. IMG_2041.jpg: JPEG, качество 90
2. IMG_2041.jpg: JPEG, качество 60
3. IMG_2041.jpg: PNG, качество 60
Редактор закрыт: IMG_2041.jpg
Запускаем очередь экспорта
```

## @starter
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Настройки экспорта - структура, то есть значение
struct ExportSettings {
    var format: String
    var quality: Int
}

// Счётчик выгрузок - класс: один объект на редактор
class ExportStats {
    var exportedCount = 0
}

// Очередь экспорта. Живёт всё время, пока открыто приложение
class ExportQueue {
    var jobs: [() -> String] = []

    func add(_ job: @escaping () -> String) {
        jobs.append(job)
    }

    // Выполняет все задачи по порядку и очищает очередь
    func runAll() -> [String] {
        let results = jobs.map { job in job() }
        jobs = []
        return results
    }
}

// Экран редактора
class EditorScreen {
    let fileName: String
    let queue: ExportQueue
    var settings = ExportSettings(format: "JPEG", quality: 90)
    let stats = ExportStats()

    init(fileName: String, queue: ExportQueue) {
        self.fileName = fileName
        self.queue = queue
    }

    // 2. Перепиши: захвати settings, fileName и stats списком захвата, без self
    func scheduleExport() {
        queue.add {
            self.stats.exportedCount += 1
            return "\(self.stats.exportedCount). \(self.fileName): \(self.settings.format), качество \(self.settings.quality)"
        }
    }

    deinit {
        lifecycleLog.append("Редактор закрыт: \(fileName)")
    }
}

// Сценарий из тикета
let exportQueue = ExportQueue()
var editor: EditorScreen? = EditorScreen(fileName: "IMG_2041.jpg", queue: exportQueue)
editor?.scheduleExport()
editor?.settings.quality = 60
editor?.scheduleExport()
editor?.settings.format = "PNG"
editor?.scheduleExport()
editor?.settings.quality = 100

// Пользователь закрыл редактор, а очередь ещё не дошла до его задач
editor = nil
lifecycleLog.append("Запускаем очередь экспорта")
for line in exportQueue.runAll() {
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

// Настройки экспорта - структура, то есть значение
struct ExportSettings {
    var format: String
    var quality: Int
}

// Счётчик выгрузок - класс: один объект на редактор
class ExportStats {
    var exportedCount = 0
}

// Очередь экспорта. Живёт всё время, пока открыто приложение
class ExportQueue {
    var jobs: [() -> String] = []

    func add(_ job: @escaping () -> String) {
        jobs.append(job)
    }

    // Выполняет все задачи по порядку и очищает очередь
    func runAll() -> [String] {
        let results = jobs.map { job in job() }
        jobs = []
        return results
    }
}

// Экран редактора
class EditorScreen {
    let fileName: String
    let queue: ExportQueue
    var settings = ExportSettings(format: "JPEG", quality: 90)
    let stats = ExportStats()

    init(fileName: String, queue: ExportQueue) {
        self.fileName = fileName
        self.queue = queue
    }

    // 2. Перепиши: захвати settings, fileName и stats списком захвата, без self
    func scheduleExport() {
        queue.add { [settings, fileName, stats] in
            stats.exportedCount += 1
            return "\(stats.exportedCount). \(fileName): \(settings.format), качество \(settings.quality)"
        }
    }

    deinit {
        lifecycleLog.append("Редактор закрыт: \(fileName)")
    }
}

// Сценарий из тикета
let exportQueue = ExportQueue()
var editor: EditorScreen? = EditorScreen(fileName: "IMG_2041.jpg", queue: exportQueue)
editor?.scheduleExport()
editor?.settings.quality = 60
editor?.scheduleExport()
editor?.settings.format = "PNG"
editor?.scheduleExport()
editor?.settings.quality = 100

// Пользователь закрыл редактор, а очередь ещё не дошла до его задач
editor = nil
lifecycleLog.append("Запускаем очередь экспорта")
for line in exportQueue.runAll() {
    print(line)
}
for entry in lifecycleLog {
    print(entry)
}
```

## @output
```
1. IMG_2041.jpg: JPEG, качество 90
2. IMG_2041.jpg: JPEG, качество 60
3. IMG_2041.jpg: PNG, качество 60
Редактор закрыт: IMG_2041.jpg
Запускаем очередь экспорта
```

## @tests
```swift
// Настройки берутся на момент постановки в очередь
lifecycleLog = []
let __t_queue = ExportQueue()
var __t_stats: ExportStats? = nil
do {
    let __t_screen = EditorScreen(fileName: "IMG_5001.jpg", queue: __t_queue)
    __t_stats = __t_screen.stats
    __t_screen.scheduleExport()
    __t_screen.settings.quality = 60
    __t_screen.scheduleExport()
    __t_screen.settings.format = "PNG"
    __t_screen.settings.quality = 100
    __eq("Постановка в очередь сама ничего не выгружает", __t_screen.stats.exportedCount, 0, hint: "Счётчик увеличивается внутри замыкания - то есть когда очередь выполняет задачу")
}
__eq("Редактор закрыт, хотя его задачи ещё в очереди", lifecycleLog, ["Редактор закрыт: IMG_5001.jpg"], hint: "Замыкание в очереди не должно держать редактор. Убери self из замыкания: захвати settings, fileName и stats списком захвата")
let __t_results = __t_queue.runAll()
__eq("Первая задача - с настройками на момент первого нажатия: JPEG, 90", __t_results.first ?? "нет задачи", "1. IMG_5001.jpg: JPEG, качество 90", hint: "Задача должна выгрузить файл и после закрытия редактора, с настройками на момент нажатия. Захвати settings, fileName и stats списком захвата: [settings, fileName, stats]")
__eq("Вторая задача - JPEG, 60, хотя потом выбрали PNG и 100", __t_results.last ?? "нет задачи", "2. IMG_5001.jpg: JPEG, качество 60", hint: "Последующие изменения settings не должны попадать в уже поставленные задачи")
__eq("Ровно две задачи в очереди", __t_results.count, 2)
__eq("Счётчик выгрузок общий: после двух задач он равен 2", __t_stats?.exportedCount ?? -1, 2, hint: "stats - объект класса. В списке захвата копируется ссылка, и все задачи меняют один и тот же счётчик")

// Счётчик общий для задач одного редактора, но у разных редакторов свой
lifecycleLog = []
let __t_shared = ExportQueue()
do {
    let __t_first = EditorScreen(fileName: "IMG_6001.jpg", queue: __t_shared)
    let __t_second = EditorScreen(fileName: "IMG_6002.jpg", queue: __t_shared)
    __t_first.settings.format = "HEIC"
    __t_first.settings.quality = 75
    __t_first.scheduleExport()
    __t_second.scheduleExport()
    __t_first.settings.quality = 50
    __t_first.scheduleExport()
}
__eq("Оба редактора закрыты до запуска очереди", lifecycleLog.sorted(), ["Редактор закрыт: IMG_6001.jpg", "Редактор закрыт: IMG_6002.jpg"], hint: "В замыкании не должно быть self: тогда очередь не держит редакторы")
__eq("Задачи двух редакторов: у каждого своя нумерация и свои настройки", __t_shared.runAll(), ["1. IMG_6001.jpg: HEIC, качество 75", "1. IMG_6002.jpg: JPEG, качество 90", "2. IMG_6001.jpg: HEIC, качество 50"], hint: "Номер - это stats.exportedCount после увеличения, а stats у каждого редактора свой")
__eq("После выполнения очередь пуста", __t_shared.runAll(), [])
```

## @rules
- must: /queue\.add\s*\{\s*\[[^\]]*\bsettings\b[^\]]*\]/ :: Захвати настройки списком захвата: `queue.add { [settings, fileName, stats] in ... }`.
- mustnot: /queue\.add\s*\{[^}]*\bself\b/ :: В замыкании не должно быть `self`: перечисли в списке захвата всё, что ему нужно.

## @hint1
Сейчас замыкание обращается к трём свойствам через `self.`: к `settings`, `fileName` и `stats`. Из-за этого оно захватывает весь редактор и читает настройки в момент выполнения задачи, а не в момент нажатия.

Добавь список захвата: сразу после открывающей фигурной скобки, перед словом `in`, в квадратных скобках перечисли через запятую эти три свойства. Тогда в момент вызова `scheduleExport()` Swift скопирует их в константы замыкания. Потом убери из тела все `self.` — имена внутри теперь означают захваченные копии.

Подумай, что получится с каждым свойством. `settings` — структура, значит, копия настроек застынет такой, какой была в момент нажатия. `fileName` — строка, тоже значение. А `stats` — объект класса: скопируется ссылка, и все задачи будут увеличивать один и тот же счётчик.

## @hint2
Список захвата пишется перед `in`. Если у замыкания нет параметров, остаётся только он:

```swift
let upload = { [caption, counter] in
    counter.uploaded += 1
    print("\(counter.uploaded). \(caption)")
}
```

В методе класса так же можно перечислить свойства — без `self.`:

```swift
return { [title, photoCount] in
    "\(title): \(photoCount) фото"
}
```

## @hint3
Осталось заполнить список захвата и убрать `self.`:

```swift
func scheduleExport() {
    queue.add { [___] in
        stats.exportedCount += 1
        return "\(stats.exportedCount). \(___): \(settings.format), качество \(settings.quality)"
    }
}
```

В первом пропуске — три имени через запятую: настройки, имя файла и счётчик. Во втором — имя файла, уже без `self.`.

## @hint4
Вот готовое решение:

{{solution}}

**Что было не так.** В старом замыкании везде стояло `self.`. Замыкание захватывало редактор целиком и держало его, пока задача лежала в очереди. Поэтому закрытый редактор оставался в памяти. А настройки читались, когда очередь выполняла задачу. К тому времени пользователь успевал сдвинуть ползунок, и все задачи получали последние значения.

**Что делает список захвата.** `[settings, fileName, stats]` выполняется в момент создания замыкания, то есть при нажатии «В очередь». Каждое имя превращается в константу внутри замыкания:

- `settings` — структура. Копируется значение, и дальнейшие изменения `settings` у редактора эту копию не трогают;
- `fileName` — строка, тоже значение;
- `stats` — объект класса. Копируется ссылка, поэтому все задачи одного редактора работают с одним счётчиком. Первая выполненная задача делает его 1, вторая — 2.

**Почему редактор теперь освобождается.** В замыкании нет `self`, значит, редактор оно не держит. Оно держит только копии настроек и имени и объект `stats`. После `editor = nil` редактор исчезает сразу, а его задачи спокойно ждут очереди — у них есть всё нужное.

**Почему здесь не подходит `[weak self]`.** Со слабым `self` редактор тоже освободился бы. Но тогда задача, дойдя до выполнения, нашла бы вместо редактора `nil` и не смогла бы ничего выгрузить. А экспорт должен состояться и после закрытия редактора. Поэтому захватываем не весь объект, а только нужные значения.

**Типичные ошибки:**

- в списке захвата только `settings`, а в теле осталось `self.fileName` — редактор снова держится замыканием;
- номер посчитан до увеличения счётчика — первая задача получит 0;
- захвачено `[count = stats.exportedCount]` вместо `stats` — это копия числа, и обе задачи получат одинаковый номер.
