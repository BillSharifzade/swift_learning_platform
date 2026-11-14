---
title: Сеть недоступна
concept: Асинхронные функции с ошибками — async throws и try await
---

## @description

### Контекст
В метро, в лифте или за городом связь пропадает. Сейчас «Горизонт» в такой ситуации показывает пустой экран, и в отзывах пишут: «Приложение сломалось». А ещё бывает, что человек ищет маленький посёлок, о котором сервер погоды ничего не знает.

Тикет от дизайнера: «Запрос прогноза может закончиться неудачей, и человек должен понимать почему. Нет сети — так и пишем. Нет такого города — называем город. Всё остальное — общее сообщение, без технических подробностей».

### Новое в Swift
Представь, что ты звонишь в службу доставки. Ожидание может закончиться по-разному: тебе ответят, или ты услышишь «абонент недоступен», или оператор скажет, что такого адреса нет. Ждать приходится в любом случае, но результат — не всегда ответ.

С ошибками ты уже знакома: функция с `throws` может вместо результата бросить ошибку. Асинхронная функция тоже может быть «бросающей». Тогда в объявлении стоят оба слова — **сначала `async`, потом `throws`**:

```swift
enum UploadError: Error {
    case tooLarge
}

func uploadPhoto(sizeInMegabytes: Int) async throws -> String {
    try await Task.sleep(for: .milliseconds(20))
    guard sizeInMegabytes <= 10 else {
        throw UploadError.tooLarge
    }
    return "photo-42.jpg"
}
```

При вызове тоже нужны оба слова, но в обратном порядке: **`try await`**. Swift требует именно такой порядок, `await try` не соберётся. Обрабатывают ошибки знакомым `do` / `catch`:

```swift
do {
    let name = try await uploadPhoto(sizeInMegabytes: 25)
    print("Загружено: \(name)")
} catch UploadError.tooLarge {
    print("Фото слишком большое")
} catch {
    print("Не получилось: \(error)")
}
```

Всё как с обычными ошибками. Разница одна: перед вызовом появилось `await`, потому что здесь мы ещё и ждём.

Обрати внимание на первую строку `uploadPhoto`. `Task.sleep` — пауза, которой мы изображаем сеть, — сама объявлена как `async throws`. Она бросает ошибку, если ожидание отменили. В прошлой задаче ошибку глушил `try?`. Теперь пишем честно: `try await`. Если пауза оборвётся, ошибка уйдёт наружу, к тому, кто вызвал функцию.

> 💡 Поэтому последний `catch` без условия здесь нужен не «для порядка». Кроме твоих `WeatherError` из функции может прилететь и чужая ошибка — например, от `Task.sleep`.

### Задача
В редакторе уже есть перечисление `WeatherError` и данные сервера `serverData`. Сети в тренажёре нет, поэтому её состояние передаётся параметром `isOnline`.

1. Напиши функцию `fetchTemperature(city:isOnline:)`. Параметры: `city` типа `String` и `isOnline` типа `Bool`. Функция асинхронная, бросает ошибки и возвращает `Int`. Шаги строго по порядку:
   - подожди ответа сети: `try await Task.sleep(for: .milliseconds(30))`;
   - если сети нет — брось `WeatherError.offline`;
   - если города нет в `serverData` — брось `WeatherError.cityNotFound(city)`;
   - иначе верни температуру.
2. Напиши функцию `forecastMessage(city:isOnline:)` с теми же параметрами. Она асинхронная, но ошибок **не бросает** и возвращает `String`. Вызови `fetchTemperature` и верни текст для экрана:
   - всё получилось — `Сейчас в городе Сочи: 14`;
   - нет сети — `Нет сети. Попробуйте позже`;
   - нет города — `Город Тверь не найден` (название из ошибки);
   - любая другая ошибка — `Не удалось загрузить прогноз`.

### Пример
```swift
await forecastMessage(city: "Казань", isOnline: true)    // "Сейчас в городе Казань: -3"
await forecastMessage(city: "Казань", isOnline: false)   // "Нет сети. Попробуйте позже"
await forecastMessage(city: "Тверь", isOnline: true)     // "Город Тверь не найден"
```

## @starter
```swift
// Почему не удалось загрузить прогноз
enum WeatherError: Error {
    case offline                  // нет сети
    case cityNotFound(String)     // сервер не знает такого города
}

// Данные сервера погоды (заглушка)
let serverData = ["Москва": 5, "Сочи": 14, "Казань": -3, "Мурманск": 0]

// 1. Напиши функцию fetchTemperature(city:isOnline:) — async throws -> Int


// 2. Напиши функцию forecastMessage(city:isOnline:) — async -> String


// Проба: меняй город и состояние сети
print(await forecastMessage(city: "Казань", isOnline: true))
```

## @solution
```swift
// Почему не удалось загрузить прогноз
enum WeatherError: Error {
    case offline                  // нет сети
    case cityNotFound(String)     // сервер не знает такого города
}

// Данные сервера погоды (заглушка)
let serverData = ["Москва": 5, "Сочи": 14, "Казань": -3, "Мурманск": 0]

// 1. Напиши функцию fetchTemperature(city:isOnline:) — async throws -> Int
func fetchTemperature(city: String, isOnline: Bool) async throws -> Int {
    try await Task.sleep(for: .milliseconds(30))
    guard isOnline else {
        throw WeatherError.offline
    }
    guard let temperature = serverData[city] else {
        throw WeatherError.cityNotFound(city)
    }
    return temperature
}

// 2. Напиши функцию forecastMessage(city:isOnline:) — async -> String
func forecastMessage(city: String, isOnline: Bool) async -> String {
    do {
        let temperature = try await fetchTemperature(city: city, isOnline: isOnline)
        return "Сейчас в городе \(city): \(temperature)"
    } catch WeatherError.offline {
        return "Нет сети. Попробуйте позже"
    } catch WeatherError.cityNotFound(let name) {
        return "Город \(name) не найден"
    } catch {
        return "Не удалось загрузить прогноз"
    }
}

// Проба: меняй город и состояние сети
print(await forecastMessage(city: "Казань", isOnline: true))
```

## @tests
```swift
do {
    __eq("Сочи при хорошей сети: 14", try await fetchTemperature(city: "Сочи", isOnline: true), 14, hint: "Если сеть есть и город известен, верни температуру из serverData")
    __eq("Мурманск при хорошей сети: 0", try await fetchTemperature(city: "Мурманск", isOnline: true), 0)
} catch {
    __fail("Известный город при хорошей сети загружается без ошибок", "Функция бросила ошибку: \(error)")
}

do {
    _ = try await fetchTemperature(city: "Сочи", isOnline: false)
    __fail("Нет сети — ошибка offline", "Функция вернула число, хотя сети нет. Брось WeatherError.offline")
} catch WeatherError.offline {
    __pass("Нет сети — ошибка offline")
} catch {
    __fail("Нет сети — ошибка offline", "Брошена другая ошибка: \(error)")
}

do {
    _ = try await fetchTemperature(city: "Тверь", isOnline: true)
    __fail("Неизвестный город — ошибка cityNotFound", "Функция вернула число для города, которого нет в serverData")
} catch WeatherError.cityNotFound(let name) {
    __eq("Неизвестный город — ошибка cityNotFound с названием города", name, "Тверь", hint: "В ошибку нужно положить название города: WeatherError.cityNotFound(city)")
} catch {
    __fail("Неизвестный город — ошибка cityNotFound", "Брошена другая ошибка: \(error)")
}

do {
    _ = try await fetchTemperature(city: "Тверь", isOnline: false)
    __fail("Нет сети и неизвестный город — сначала offline", "Функция вернула число")
} catch WeatherError.offline {
    __pass("Нет сети и неизвестный город — сначала offline")
} catch {
    __fail("Нет сети и неизвестный город — сначала offline", "Брошена другая ошибка: \(error). Без сети до сервера запрос не доходит, поэтому сеть проверяется раньше города")
}

__eq("Сообщение для Казани", await forecastMessage(city: "Казань", isOnline: true), "Сейчас в городе Казань: -3")
__eq("Сообщение для Москвы", await forecastMessage(city: "Москва", isOnline: true), "Сейчас в городе Москва: 5", hint: "Температуру нужно брать из результата fetchTemperature")
__eq("Сообщение без сети", await forecastMessage(city: "Москва", isOnline: false), "Нет сети. Попробуйте позже", hint: "Поймай WeatherError.offline отдельным catch")
__eq("Сообщение про неизвестный город", await forecastMessage(city: "Тверь", isOnline: true), "Город Тверь не найден", hint: "Достань название из ошибки: catch WeatherError.cityNotFound(let name)")
__eq("Сообщение про другой неизвестный город", await forecastMessage(city: "Выборг", isOnline: true), "Город Выборг не найден")

let __t_cancelled = await Task {
    withUnsafeCurrentTask { $0?.cancel() }
    return await forecastMessage(city: "Сочи", isOnline: true)
}.value
__eq("Ожидание оборвалось — общее сообщение", __t_cancelled, "Не удалось загрузить прогноз", hint: "Паузу пиши через try await Task.sleep, без вопросительного знака. Если ожидание прервут, Task.sleep бросит свою ошибку, и её поймает последний catch")
```

## @rules
- must: /func\s+fetchTemperature\s*\([^)]*\)\s*async\s+throws\b/ :: Объяви `fetchTemperature` как `async throws` — именно в таком порядке, после скобок с параметрами.
- must: /try\s+await\s+Task\.sleep/ :: В `fetchTemperature` подожди сеть честно: `try await Task.sleep(for: .milliseconds(30))`, без вопросительного знака после `try`.
- must: /try\s+await\s+fetchTemperature\s*\(/ :: В `forecastMessage` вызови `fetchTemperature` через `try await` внутри `do`.

## @hint1
Начни с `fetchTemperature`. В объявлении после скобок с параметрами стоят два слова: сначала `async`, потом `throws`, затем стрелка и `Int`.

Тело — четыре шага сверху вниз. Первый: пауза `Task.sleep`. Она сама может бросить ошибку и сама асинхронная, поэтому перед ней `try await`. Второй: если `isOnline` ложно, брось ошибку `offline`. Удобно через `guard`: требование «сеть есть», иначе `throw`. Третий: достань температуру из словаря `serverData` через `guard let`. Если её нет, брось `cityNotFound` и передай в скобках название города. Четвёртый: верни найденное число.

Теперь `forecastMessage`. В объявлении только `async`: ошибки эта функция ловит сама. Внутри — `do`, в нём вызов `fetchTemperature` через `try await` и `return` с текстом про температуру. После `do` идут три `catch`: для `offline`, для `cityNotFound` с привязкой названия через `let` и последний, общий, для всего остального.

## @hint2
Объявление и первые шаги `fetchTemperature`:

```swift
func fetchTemperature(city: String, isOnline: Bool) async throws -> Int {
    try await Task.sleep(for: .milliseconds(30))
    guard isOnline else {
        throw WeatherError.offline
    }
    // дальше — поиск города в serverData
}
```

А вот как ловят ошибку со связанным значением — ты уже делала так в «Монете»:

```swift
catch UploadError.tooLarge {
    return "Фото слишком большое"
}
```

Если у случая есть значение, его достают прямо в `catch`: `catch WeatherError.cityNotFound(let name)`.

## @hint3
Заполни пропуски:

```swift
func fetchTemperature(city: String, isOnline: Bool) ___ -> Int {
    try await Task.sleep(for: .milliseconds(30))
    guard isOnline else {
        throw WeatherError.offline
    }
    guard let temperature = serverData[city] else {
        throw ___
    }
    return temperature
}

func forecastMessage(city: String, isOnline: Bool) async -> String {
    do {
        let temperature = ___ fetchTemperature(city: city, isOnline: isOnline)
        return "Сейчас в городе \(city): \(temperature)"
    } catch WeatherError.offline {
        return "Нет сети. Попробуйте позже"
    } catch WeatherError.cityNotFound(let name) {
        return "Город \(name) не найден"
    } catch {
        return ___
    }
}
```

В первом пропуске — два слова, которые делают функцию асинхронной и бросающей. Во втором — ошибка про неизвестный город вместе с названием. В третьем — два слова перед вызовом. В четвёртом — общее сообщение.

## @hint4
Вот готовое решение:

{{solution}}

**Как устроена `fetchTemperature`.** `async throws` в объявлении говорит сразу две вещи: функция ждёт и может закончиться ошибкой. Сначала она ждёт «сеть» через `try await Task.sleep`. Потом два `guard` по очереди проверяют, что сеть есть и что город известен. Если требование не выполнено, `throw` бросает ошибку и функция сразу заканчивается. До `return` доходят только удачные запросы.

**Почему порядок проверок именно такой.** Без сети запрос до сервера не доходит, и узнать, есть ли такой город, просто невозможно. Поэтому для Твери без сети правильный ответ — «нет сети», а не «город не найден».

**Как устроена `forecastMessage`.** Она асинхронная, но не бросающая: все ошибки она превращает в понятный текст. Внутри `do` стоит `try await fetchTemperature(...)`. Если ошибки нет, в `temperature` попадает число, и функция возвращает строку с ним. Если ошибка есть, выполнение прыгает в первый подходящий `catch`. Для `cityNotFound` название города достаётся из ошибки через `let name`.

**Зачем общий `catch`.** `Task.sleep` бросает собственную ошибку, если ожидание прервали. Например, когда человек закрыл экран, не дождавшись прогноза. Это не `WeatherError`, и без последнего `catch` её некому было бы поймать. Swift это знает и без общего `catch` не соберёт код: функция без `throws` обязана поймать всё.

**Типичные ошибки:**

- `throws async` вместо `async throws` или `await try` вместо `try await` — Swift требует строгий порядок;
- `try?` перед `Task.sleep` — оборванное ожидание тогда незаметно проглатывается, и вместо общего сообщения приходит прогноз;
- проверка города стоит раньше проверки сети — для неизвестного города без сети придёт не то сообщение;
- в `forecastMessage` добавлено `throws` — тогда ошибки уйдут к экрану, а он ждёт готовый текст.
