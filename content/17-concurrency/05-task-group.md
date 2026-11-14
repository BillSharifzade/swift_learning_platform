---
title: Прогноз для списка городов
concept: Группа задач — withTaskGroup
---

## @description

### Контекст
На вкладке «Мои города» человек хранит свой список: дом, дача, город, где живут родители, и город, куда скоро командировка. Порядок он настраивает сам, перетаскивая строки пальцем. У кого-то в списке два города, у кого-то девять.

Сейчас прогнозы загружаются по одному, и длинный список открывается почти полсекунды. Тикет от тимлида: «Загружай прогнозы для всех городов одновременно. Но строки на экране должны идти ровно в том порядке, который выбрал пользователь, а не в том, в котором ответили серверы».

### Новое в Swift
Представь, что ты зовёшь гостей на праздник. Ты не ждёшь ответа от первого, чтобы только потом написать второму, — приглашения уходят всем сразу. Ответы приходят вразнобой, и каждый ты отмечаешь в своём списке напротив нужного гостя. Список остаётся в твоём порядке, как бы ни приходили ответы.

`async let` из прошлой задачи хорош, когда запросов заранее известное число: три запроса — три строки. А здесь городов сколько угодно, их число известно только во время работы. Для этого есть **группа задач**:

```swift
let photoNames = ["море.jpg", "горы.jpg", "лес.jpg"]

let sizes = await withTaskGroup(of: (String, Int).self) { group in
    for name in photoNames {
        group.addTask {
            (name, await fetchPhotoSize(name: name))
        }
    }

    var result: [String: Int] = [:]
    for await (name, size) in group {
        result[name] = size
    }
    return result
}
```

Разберём по частям:

- `withTaskGroup(of: (String, Int).self)` создаёт группу. В `of:` указывают, какого типа результат вернёт каждая задача группы. Запись `.self` после типа означает «сам этот тип», так его передают как значение;
- `group.addTask { ... }` добавляет в группу задачу и **сразу** её запускает. В цикле задачи запускаются одна за другой, не дожидаясь друг друга;
- `for await ... in group` получает результаты по одному, **по мере готовности**. Кто ответил первым, тот и придёт первым;
- то, что вернёт замыкание группы через `return`, станет результатом всего `withTaskGroup`. Наружу он выйдет, только когда закончатся все задачи.

> ⚠️ Результаты приходят в порядке готовности, а не в порядке запуска. Сегодня быстрее ответил один сервер, завтра другой. Поэтому их сначала собирают туда, где порядок не важен, например в словарь, а потом выстраивают в нужном порядке по исходному списку.

### Задача
В редакторе есть структура `CityWeather` и готовая функция `fetchWeather(city:)`. Сервер каждого города отвечает со своей скоростью, от 20 до 50 мс. Если о городе нет данных, в `temperature` придёт `nil`.

1. Напиши асинхронную функцию `loadForecasts(for:)`. Параметр `cities` типа `[String]`, при вызове метка `for`. Функция возвращает `[CityWeather]`.
2. Загрузи прогнозы для всех городов **одновременно** через `withTaskGroup`: по задаче `fetchWeather(city:)` на каждый город.
3. Верни прогнозы **в том же порядке, что и города** в `cities`. Пустой список — пустой результат.

Проверка засекает время: девять городов должны загрузиться быстрее, чем по очереди.

### Пример
```swift
await loadForecasts(for: ["Москва", "Сочи"])
// [CityWeather(city: "Москва", temperature: Optional(5)),
//  CityWeather(city: "Сочи", temperature: Optional(14))]
// Сочи отвечает быстрее Москвы, но в результате Москва первая — как в списке.
```

Вывод программы:

```text
Якутск: -25
Москва: 5
Сочи: 14
Тверь: нет данных
```

## @starter
```swift
// Прогноз для одного города
struct CityWeather: Equatable {
    let city: String
    let temperature: Int?    // nil — у сервера нет данных о городе
}

// Готовый запрос. Сервер каждого города отвечает со своей скоростью.
func fetchWeather(city: String) async -> CityWeather {
    // температура и время ответа сервера в миллисекундах
    let servers: [String: (temperature: Int, delay: Int)] = [
        "Москва": (5, 50), "Сочи": (14, 20), "Казань": (-3, 40),
        "Мурманск": (0, 30), "Калининград": (1, 45), "Якутск": (-25, 50),
        "Владивосток": (3, 35), "Самара": (-1, 25), "Омск": (-8, 50)
    ]
    guard let answer = servers[city] else {
        try? await Task.sleep(for: .milliseconds(20))
        return CityWeather(city: city, temperature: nil)
    }
    try? await Task.sleep(for: .milliseconds(answer.delay))
    return CityWeather(city: city, temperature: answer.temperature)
}

// Напиши функцию loadForecasts(for:) — все города одновременно, порядок как в списке


// Проба: вкладка "Мои города"
let myCities = ["Якутск", "Москва", "Сочи", "Тверь"]
for weather in await loadForecasts(for: myCities) {
    if let temperature = weather.temperature {
        print("\(weather.city): \(temperature)")
    } else {
        print("\(weather.city): нет данных")
    }
}
```

## @solution
```swift
// Прогноз для одного города
struct CityWeather: Equatable {
    let city: String
    let temperature: Int?    // nil — у сервера нет данных о городе
}

// Готовый запрос. Сервер каждого города отвечает со своей скоростью.
func fetchWeather(city: String) async -> CityWeather {
    // температура и время ответа сервера в миллисекундах
    let servers: [String: (temperature: Int, delay: Int)] = [
        "Москва": (5, 50), "Сочи": (14, 20), "Казань": (-3, 40),
        "Мурманск": (0, 30), "Калининград": (1, 45), "Якутск": (-25, 50),
        "Владивосток": (3, 35), "Самара": (-1, 25), "Омск": (-8, 50)
    ]
    guard let answer = servers[city] else {
        try? await Task.sleep(for: .milliseconds(20))
        return CityWeather(city: city, temperature: nil)
    }
    try? await Task.sleep(for: .milliseconds(answer.delay))
    return CityWeather(city: city, temperature: answer.temperature)
}

// Напиши функцию loadForecasts(for:) — все города одновременно, порядок как в списке
func loadForecasts(for cities: [String]) async -> [CityWeather] {
    await withTaskGroup(of: CityWeather.self) { group in
        for city in cities {
            group.addTask {
                await fetchWeather(city: city)
            }
        }

        var byCity: [String: CityWeather] = [:]
        for await weather in group {
            byCity[weather.city] = weather
        }
        return cities.compactMap { byCity[$0] }
    }
}

// Проба: вкладка "Мои города"
let myCities = ["Якутск", "Москва", "Сочи", "Тверь"]
for weather in await loadForecasts(for: myCities) {
    if let temperature = weather.temperature {
        print("\(weather.city): \(temperature)")
    } else {
        print("\(weather.city): нет данных")
    }
}
```

## @output
```
Якутск: -25
Москва: 5
Сочи: 14
Тверь: нет данных
```

## @tests
```swift
let __t_three = await loadForecasts(for: ["Москва", "Сочи", "Казань"])
__eq("Три города в порядке списка, хотя Сочи отвечает первым", __t_three.map { $0.city }, ["Москва", "Сочи", "Казань"], hint: "Результаты группы приходят по мере готовности. Собери их в словарь, а потом выстрой по исходному массиву cities")
__eq("Три города: температуры на своих местах", __t_three.map { $0.temperature }, [5, 14, -3])

let __t_reversed = await loadForecasts(for: ["Омск", "Самара", "Мурманск", "Калининград"])
__eq("Другой порядок списка сохраняется", __t_reversed.map { $0.city }, ["Омск", "Самара", "Мурманск", "Калининград"], hint: "Порядок задаёт пользователь: выстрой прогнозы по массиву cities — не по скорости ответа и не по алфавиту")
__eq("Другой порядок: температуры", __t_reversed.map { $0.temperature }, [-8, -1, 0, 1])

__eq("Один город", await loadForecasts(for: ["Владивосток"]), [CityWeather(city: "Владивосток", temperature: 3)])
__eq("Пустой список городов — пустой результат", await loadForecasts(for: []), [], hint: "Если городов нет, группа ничего не запускает, и результат — пустой массив")

let __t_unknown = await loadForecasts(for: ["Сочи", "Тверь", "Москва"])
__eq("Город без данных остаётся на своём месте", __t_unknown, [CityWeather(city: "Сочи", temperature: 14), CityWeather(city: "Тверь", temperature: nil), CityWeather(city: "Москва", temperature: 5)], hint: "Прогноз с temperature = nil — тоже результат. Не выбрасывай его")

let __t_all = ["Москва", "Сочи", "Казань", "Мурманск", "Калининград", "Якутск", "Владивосток", "Самара", "Омск"]
let __t_clock = ContinuousClock()
var __t_best = Duration.seconds(100)
var __t_allResult: [CityWeather] = []
for _ in 1...2 {
    let __t_start = __t_clock.now
    __t_allResult = await loadForecasts(for: __t_all)
    let __t_elapsed = __t_clock.now - __t_start
    if __t_elapsed < __t_best { __t_best = __t_elapsed }
}
__eq("Девять городов: все на месте и по порядку", __t_allResult.map { $0.city }, __t_all)
__ok("Девять городов загружаются одновременно, а не по очереди", __t_best < .milliseconds(250), hint: "Похоже, прогнозы загружаются друг за другом (больше 300 мс). Запускай каждый через group.addTask, а ответы собирай в for await")
```

## @rules
- must: /\bwithTaskGroup\s*\(/ :: Загружай прогнозы через группу задач: `withTaskGroup(of: CityWeather.self) { group in ... }`.
- must: /\.addTask\s*\{/ :: Каждый город добавь в группу отдельной задачей: `group.addTask { ... }`.

## @hint1
Функция начинается как обычная асинхронная: метка `for`, внутреннее имя `cities`, результат — массив `CityWeather`. Всё тело — это `await withTaskGroup(...)`, и его результат функция возвращает. Каждая задача группы вернёт один `CityWeather`, это и указывается в `of:`.

Внутри группы два этапа. Первый: цикл по городам, и для каждого `group.addTask` с вызовом `fetchWeather`. Здесь ничего не ждёшь — только запускаешь.

Второй этап: сбор. Заведи пустой словарь, где ключ — название города, а значение — его прогноз. Циклом `for await` по группе получай готовые прогнозы и клади каждый в словарь под его городом. Когда цикл закончится, ответят все серверы.

Остаётся выстроить результат в нужном порядке. Пройди по исходному массиву `cities` и для каждого города достань прогноз из словаря. Удобно через `compactMap`: чтение из словаря даёт опционал, а `compactMap` его развернёт.

## @hint2
Каркас группы задач:

```swift
await withTaskGroup(of: CityWeather.self) { group in
    for city in cities {
        group.addTask {
            await fetchWeather(city: city)
        }
    }
    // дальше — сбор результатов
}
```

А так результаты собираются и выстраиваются по исходному списку:

```swift
var byCity: [String: CityWeather] = [:]
for await weather in group {
    byCity[weather.city] = weather
}
return cities.compactMap { byCity[$0] }
```

## @hint3
Заполни пропуски:

```swift
func loadForecasts(for cities: [String]) async -> [CityWeather] {
    await withTaskGroup(of: ___) { group in
        for city in cities {
            group.___ {
                await fetchWeather(city: city)
            }
        }

        var byCity: [String: CityWeather] = [:]
        for ___ weather in group {
            byCity[weather.city] = weather
        }
        return cities.compactMap { byCity[$0] }
    }
}
```

В первом пропуске — тип результата одной задачи и `.self` после него. Во втором — метод, который добавляет задачу в группу. В третьем — слово, без которого по группе не пройти циклом: результаты приходят не сразу.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `withTaskGroup(of: CityWeather.self)` создаёт группу, в которой каждая задача вернёт один `CityWeather`. Первый цикл ничего не ждёт: `group.addTask` запускает загрузку и сразу переходит к следующему городу. За доли миллисекунды стартуют все девять запросов. Второй цикл, `for await`, получает прогнозы по мере готовности: сначала Сочи (20 мс), потом Самару (25 мс) и так далее. Через 50 мс ответят все, и цикл закончится.

**Зачем словарь.** В `for await` прогнозы приходят в порядке скорости серверов, а не в порядке списка. Положить их сразу в массив — значит перемешать строки на экране. Словарь не хранит порядок, зато по названию города мгновенно находит его прогноз. Последняя строка проходит по `cities` — по списку пользователя — и достаёт прогнозы ровно в этом порядке. `compactMap` нужен, потому что `byCity[$0]` даёт опционал. Здесь там всегда есть значение: на каждый город запущена своя задача.

**Почему результат группы можно сразу вернуть.** Всё, что замыкание группы вернуло через `return`, становится результатом `withTaskGroup`. Функция состоит из одного выражения, поэтому `return` перед `await withTaskGroup` можно не писать.

**Типичные ошибки:**

- `var result: [CityWeather] = []` и `result.append(weather)` в `for await` — данные верные, но порядок зависит от скорости серверов;
- `result.sorted { $0.city < $1.city }` — алфавитный порядок, а нужен пользовательский;
- `await` внутри первого цикла вместо `addTask`: `let weather = await fetchWeather(city: city)` — тогда города загружаются по очереди, и группа теряет смысл;
- забыт `await` перед `withTaskGroup` — группа сама асинхронная, её тоже нужно дождаться.
