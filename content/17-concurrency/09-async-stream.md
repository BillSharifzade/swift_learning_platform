---
title: Поток обновлений
concept: AsyncStream и continuation — итог модуля
---

## @description

### Контекст
Финальная задача модуля — живой виджет температуры. «Горизонт» подключается к городской метеостанции, и та присылает свежие показания, пока экран открыт. Виджет показывает температуру прямо сейчас, а под ней — минимум и максимум за время наблюдения.

Метеостанция поставляет готовый SDK — библиотеку для работы с ней. SDK старый: показания он отдаёт через замыкания, как в «Ярмарке» до `async`/`await`. Тимлид ставит задачу: «Оберни SDK в `AsyncStream`. Пусть остальной код получает показания обычным `for await`, а модель виджета живёт на главном акторе, как модель экрана погоды».

### Новое в Swift
Представь суши-бар с конвейером. Повар ставит тарелки на ленту, когда они готовы, а ты берёшь их одну за другой. Ты не знаешь заранее, сколько будет тарелок и когда приедет следующая. Просто ждёшь, пока лента работает. Когда повар выключает конвейер, ужин окончен.

До сих пор асинхронная функция давала **один** ответ. А показания станции приходят **потоком**: одно, через время ещё одно, и так, пока станция работает. Для этого есть `AsyncStream` — асинхронная последовательность. Получают значения из неё циклом `for await`, как из группы задач:

```swift
for await percent in downloadProgress {
    print("Загружено \(percent)%")
}
print("Готово")   // после того как поток закончился
```

Цикл ждёт каждое следующее значение и заканчивается, когда закончился поток.

**Как создать поток.** `AsyncStream` создаётся с замыканием. В него приходит **`continuation`** («продолжение») — пульт управления потоком. У пульта две главные кнопки:

- `continuation.yield(значение)` — отправить в поток очередное значение. Повар поставил тарелку на ленту;
- `continuation.finish()` — закончить поток. Повар выключил конвейер. После этого `for await` у получателя завершится.

Чаще всего так оборачивают код, который сообщает о событиях через замыкания. Вот прогресс скачивания файла:

```swift
func progressUpdates(of download: FileDownload) -> AsyncStream<Int> {
    AsyncStream { continuation in
        download.begin(
            onProgress: { percent in
                continuation.yield(percent)
            },
            onComplete: {
                continuation.finish()
            }
        )
    }
}
```

`AsyncStream<Int>` — поток целых чисел. Замыкание выполняется один раз, при создании потока: оно подключает обработчики и сразу заканчивается. А значения идут в поток позже, каждый раз, когда SDK вызывает `onProgress`.

> ⚠️ Если забыть `finish()`, поток никогда не закончится, и `for await` будет ждать вечно. Программа не завершится, и проверка остановит её с сообщением, что она работает слишком долго. Увидишь такое в этой задаче — первым делом проверь `finish()`.

**Что ещё пригодится.** Всё остальное ты уже умеешь. Модель того, что на экране, отмечают `@MainActor`, а снаружи её методы вызывают через `await`. А `last`, `min()` и `max()` у массива возвращают опционалы — ты знаешь это из «Рядом».

### Задача
В редакторе есть SDK станции — класс `WeatherStation` с методом `start(onReading:onFinish:)`. Он присылает показания по одному, примерно раз в 10 мс, а после последнего вызывает `onFinish`. SDK менять нельзя.

1. Напиши функцию `temperatureUpdates(from:)`. Параметр `station` типа `WeatherStation`, при вызове метка `from`. Функция **не** асинхронная и возвращает `AsyncStream<Int>`. Внутри запусти станцию: каждое показание отправляй в поток через `yield`, а по `onFinish` заканчивай поток через `finish()`.
2. Объяви класс `LiveTemperatureModel`, отмеченный `@MainActor`:
   - свойство `history` типа `[Int]`, в начале пустое. Читать можно всем, менять — только модели;
   - метод `apply(_:)` с параметром типа `Int` без метки: добавляет показание в конец `history`;
   - вычисляемое свойство `summary` типа `String`. Пока показаний нет — `Нет данных`. Иначе — `Сейчас: 0, мин: -2, макс: 4`: последнее показание, наименьшее и наибольшее.
3. Напиши асинхронную функцию `trackLiveTemperature(station:model:)`. Параметры: `station` типа `WeatherStation` и `model` типа `LiveTemperatureModel`. Она получает поток от `temperatureUpdates(from:)`, передаёт каждое показание в `model.apply` и заканчивается вместе с потоком.

### Пример
```swift
let widget = LiveTemperatureModel()
widget.summary   // "Нет данных"

let station = WeatherStation(readings: [1, 4, -2, 0])
await trackLiveTemperature(station: station, model: widget)
widget.history   // [1, 4, -2, 0]
widget.summary   // "Сейчас: 0, мин: -2, макс: 4"
```

Вывод программы:

```text
Нет данных
Сейчас: -3, мин: -3, макс: 2
Показаний: 5
```

## @starter
```swift
// SDK метеостанции (чужой код, менять нельзя).
// Присылает показания по одному, примерно раз в 10 мс, потом вызывает onFinish.
// @Sendable у замыканий — обещание, что их можно вызывать из другой задачи.
final class WeatherStation: Sendable {
    let readings: [Int]

    init(readings: [Int]) {
        self.readings = readings
    }

    func start(onReading: @escaping @Sendable (Int) -> Void, onFinish: @escaping @Sendable () -> Void) {
        let readings = self.readings
        Task {
            for value in readings {
                try? await Task.sleep(for: .milliseconds(10))
                onReading(value)
            }
            onFinish()
        }
    }
}

// 1. Напиши функцию temperatureUpdates(from:) -> AsyncStream<Int>


// 2. Объяви модель виджета LiveTemperatureModel на главном акторе


// 3. Напиши функцию trackLiveTemperature(station:model:)


// Проба: станция у реки присылает пять показаний
let widget = LiveTemperatureModel()
print(widget.summary)
await trackLiveTemperature(station: WeatherStation(readings: [2, 1, -1, 0, -3]), model: widget)
print(widget.summary)
print("Показаний: \(widget.history.count)")
```

## @solution
```swift
// SDK метеостанции (чужой код, менять нельзя).
// Присылает показания по одному, примерно раз в 10 мс, потом вызывает onFinish.
// @Sendable у замыканий — обещание, что их можно вызывать из другой задачи.
final class WeatherStation: Sendable {
    let readings: [Int]

    init(readings: [Int]) {
        self.readings = readings
    }

    func start(onReading: @escaping @Sendable (Int) -> Void, onFinish: @escaping @Sendable () -> Void) {
        let readings = self.readings
        Task {
            for value in readings {
                try? await Task.sleep(for: .milliseconds(10))
                onReading(value)
            }
            onFinish()
        }
    }
}

// 1. Напиши функцию temperatureUpdates(from:) -> AsyncStream<Int>
func temperatureUpdates(from station: WeatherStation) -> AsyncStream<Int> {
    AsyncStream { continuation in
        station.start(
            onReading: { temperature in
                continuation.yield(temperature)
            },
            onFinish: {
                continuation.finish()
            }
        )
    }
}

// 2. Объяви модель виджета LiveTemperatureModel на главном акторе
@MainActor
final class LiveTemperatureModel {
    private(set) var history: [Int] = []

    var summary: String {
        guard let current = history.last, let lowest = history.min(), let highest = history.max() else {
            return "Нет данных"
        }
        return "Сейчас: \(current), мин: \(lowest), макс: \(highest)"
    }

    func apply(_ temperature: Int) {
        history.append(temperature)
    }
}

// 3. Напиши функцию trackLiveTemperature(station:model:)
func trackLiveTemperature(station: WeatherStation, model: LiveTemperatureModel) async {
    for await temperature in temperatureUpdates(from: station) {
        await model.apply(temperature)
    }
}

// Проба: станция у реки присылает пять показаний
let widget = LiveTemperatureModel()
print(widget.summary)
await trackLiveTemperature(station: WeatherStation(readings: [2, 1, -1, 0, -3]), model: widget)
print(widget.summary)
print("Показаний: \(widget.history.count)")
```

## @output
```
Нет данных
Сейчас: -3, мин: -3, макс: 2
Показаний: 5
```

## @tests
```swift
// Помощники проверки: если поток не закончился за 0,8 с, считаем его зависшим
func __t_collect(_ stream: AsyncStream<Int>) async -> [Int]? {
    await withTaskGroup(of: [Int]?.self) { group in
        group.addTask {
            var values: [Int] = []
            for await value in stream { values.append(value) }
            return values
        }
        group.addTask {
            try? await Task.sleep(for: .milliseconds(800))
            return nil
        }
        let first = await group.next() ?? nil
        group.cancelAll()
        return first
    }
}
func __t_track(_ readings: [Int], _ model: LiveTemperatureModel) async -> Bool {
    await withTaskGroup(of: Bool.self) { group in
        group.addTask {
            await trackLiveTemperature(station: WeatherStation(readings: readings), model: model)
            return true
        }
        group.addTask {
            try? await Task.sleep(for: .milliseconds(800))
            return false
        }
        let first = await group.next() ?? false
        group.cancelAll()
        return first
    }
}

let __t_stream = await __t_collect(temperatureUpdates(from: WeatherStation(readings: [3, 2, -1])))
__ok("Поток заканчивается после последнего показания", __t_stream != nil, hint: "Поток не закончился. В onFinish вызови continuation.finish() — иначе for await ждёт вечно")
__eq("Поток отдаёт все показания по порядку", __t_stream ?? [], [3, 2, -1], hint: "Каждое показание из onReading отправляй в поток: continuation.yield(temperature)")
let __t_noReadings = await __t_collect(temperatureUpdates(from: WeatherStation(readings: [])))
__eq("Станция без показаний — пустой поток, который сразу заканчивается", __t_noReadings, [], hint: "Даже если показаний нет, onFinish вызывается — и поток должен закончиться")

let __t_model = LiveTemperatureModel()
__eq("Новая модель: истории нет", __t_model.history, [])
__eq("Новая модель: Нет данных", __t_model.summary, "Нет данных", hint: "Пока history пуст, summary возвращает \"Нет данных\"")
__t_model.apply(5)
__eq("Одно показание: оно же минимум и максимум", __t_model.summary, "Сейчас: 5, мин: 5, макс: 5")
__t_model.apply(-2)
__t_model.apply(1)
__eq("Три показания: история по порядку", __t_model.history, [5, -2, 1], hint: "apply добавляет показание в конец history")
__eq("Три показания: сейчас — последнее, а не самое большое", __t_model.summary, "Сейчас: 1, мин: -2, макс: 5", hint: "Сейчас — это последнее показание, history.last")

let __t_widget = LiveTemperatureModel()
let __t_finished = await __t_track([1, 4, -2, 0], __t_widget)
__ok("Слежение заканчивается вместе с потоком", __t_finished, hint: "trackLiveTemperature должна закончиться, когда станция пришлёт все показания. Проверь continuation.finish()")
__eq("Слежение: все показания попали в модель", __t_widget.history, [1, 4, -2, 0], hint: "В цикле for await передавай каждое показание в model.apply")
__eq("Слежение: итог виджета", __t_widget.summary, "Сейчас: 0, мин: -2, макс: 4")

let __t_frost = LiveTemperatureModel()
_ = await __t_track([-15, -18, -21], __t_frost)
__eq("Мороз: все показания ниже нуля", __t_frost.summary, "Сейчас: -21, мин: -21, макс: -15")

let __t_silent = LiveTemperatureModel()
let __t_silentFinished = await __t_track([], __t_silent)
__ok("Станция без показаний: слежение сразу заканчивается", __t_silentFinished, hint: "Поток пустой станции должен закончиться сразу после onFinish")
__eq("Станция без показаний: Нет данных", __t_silent.summary, "Нет данных")
```

## @rules
- must: /\bAsyncStream\b[\s\S]*\bcontinuation\b/ :: Создай поток через `AsyncStream { continuation in ... }`.
- must: /\.yield\s*\(/ :: Отправляй показания в поток через `continuation.yield(...)`.
- must: /\.finish\s*\(\s*\)/ :: Заканчивай поток через `continuation.finish()`.
- must: /@MainActor\s+(final\s+)?class\s+LiveTemperatureModel\b/ :: Модель виджета — это то, что на экране: отметь её `@MainActor`.
- must: /private\s*\(\s*set\s*\)\s*var\s+history\b/ :: Историю читать можно всем, а менять — только модели: `private(set) var history`.
- must: /for\s+await\b/ :: Получай показания из потока циклом `for await`.

## @hint1
Начни с потока. Функция `temperatureUpdates` возвращает `AsyncStream<Int>`, и всё её тело — создание этого потока. В замыкании `AsyncStream` приходит `continuation`. Внутри вызови у станции `start`. Ему нужны два замыкания. В первом, `onReading`, отправляй пришедшее показание в поток через `yield`. Во втором, `onFinish`, закончи поток через `finish`.

Модель — класс с пометкой `@MainActor`, как модель экрана погоды. В нём хранимый массив `history` с `private(set)`, метод `apply`, который добавляет число в конец массива, и вычисляемое свойство `summary`. В `summary` удобно развернуть сразу три опционала одним `guard let`: последнее показание через `last`, минимум через `min()`, максимум через `max()`. Если массив пуст, все три — `nil`, и `guard` вернёт «Нет данных».

Последняя функция асинхронная. В ней цикл `for await` по потоку от `temperatureUpdates`, и в теле цикла — вызов `apply` у модели. Модель живёт на главном акторе, а функция нет, поэтому перед вызовом нужен `await`.

## @hint2
Обёртка над SDK с замыканиями выглядит так:

```swift
AsyncStream { continuation in
    download.begin(
        onProgress: { percent in
            continuation.yield(percent)
        },
        onComplete: {
            continuation.finish()
        }
    )
}
```

А получать значения из потока и передавать их модели на главном акторе — так:

```swift
for await temperature in temperatureUpdates(from: station) {
    await model.apply(temperature)
}
```

## @hint3
Заполни пропуски:

```swift
func temperatureUpdates(from station: WeatherStation) -> AsyncStream<Int> {
    AsyncStream { continuation in
        station.start(
            onReading: { temperature in
                ___
            },
            onFinish: {
                ___
            }
        )
    }
}

@MainActor
final class LiveTemperatureModel {
    private(set) var history: [Int] = []

    var summary: String {
        guard let current = history.last, let lowest = history.min(), let highest = history.max() else {
            return "Нет данных"
        }
        return "Сейчас: \(current), мин: \(lowest), макс: \(highest)"
    }

    func apply(_ temperature: Int) {
        history.append(temperature)
    }
}

func trackLiveTemperature(station: WeatherStation, model: LiveTemperatureModel) async {
    for ___ temperature in temperatureUpdates(from: station) {
        ___ model.apply(temperature)
    }
}
```

В первом пропуске — отправка показания в поток. Во втором — конец потока. В третьем — слово, без которого по потоку не пройти циклом. В четвёртом — слово, которое нужно перед обращением к модели на главном акторе.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает поток.** `AsyncStream { continuation in ... }` выполняет замыкание один раз: оно подключает к станции два обработчика и сразу заканчивается. Дальше работает станция. Каждые 10 мс она вызывает `onReading`, и `continuation.yield(temperature)` кладёт показание в поток. Когда показания кончились, она вызывает `onFinish`, и `continuation.finish()` закрывает поток. Так старый код с замыканиями превращается в обычную асинхронную последовательность.

**Как работает слежение.** `for await temperature in ...` ждёт очередное показание, получает его и выполняет тело цикла. Потом снова ждёт. Когда поток закрыт, цикл заканчивается, а с ним и функция. `trackLiveTemperature` не входит в главный актор, поэтому обращение к модели — `await model.apply(temperature)`: встать в очередь главного актора и обновить виджет там.

**Как устроена модель.** Она отмечена `@MainActor`, потому что на неё смотрит экран. `history` закрыт на запись, менять его можно только через `apply`. `summary` разворачивает три опционала одним `guard let`. Для пустого массива `last`, `min()` и `max()` дают `nil`, и функция честно отвечает «Нет данных». Обрати внимание: «сейчас» — это последнее показание, а не самое большое и не первое.

**Что сошлось в этой задаче.** Асинхронная функция с `await`, главный актор, `Sendable`-класс SDK с задачей `Task` внутри и поток значений. Всё это — повседневные инструменты приложений, которые получают данные из сети.

**Типичные ошибки:**

- забыт `continuation.finish()` — поток не заканчивается, и `trackLiveTemperature` ждёт вечно;
- `return` вместо `yield` в `onReading` — замыкание ничего не возвращает, значение должно уйти в поток;
- `history.first` вместо `history.last` в `summary` — на виджете навсегда останется самое первое показание;
- забыт `await` перед `model.apply` — Swift напомнит, что модель живёт на главном акторе.
