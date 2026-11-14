---
title: Обновить экран
concept: "@MainActor — главный актор для всего, что на экране"
---

## @description

### Контекст
На экране погоды «Горизонта» есть заголовок с городом, крупная цифра температуры, значок загрузки и красная плашка для ошибок. Всё это хранится в **модели экрана** — объекте, на который смотрит интерфейс. Поменялось свойство модели — поменялось и то, что видит человек.

Тестировщица прислала видео: при плохой связи цифра на экране иногда мигает, а значок загрузки не исчезает. Тимлид нашёл причину: «Модель меняют из фоновых задач. А экран можно трогать только из главного потока. Отметь модель как `@MainActor` — и пусть компилятор следит за этим сам».

### Новое в Swift
Представь табло в аэропорту. Его обновляет **один** диспетчер. Регистрация, багажная служба, метеослужба присылают ему новости, а он по очереди меняет строки. Если бы буквы на табло переставляли пятеро одновременно, пассажиры увидели бы мешанину из двух рейсов.

С интерфейсом приложения так же. Экран рисует только один **главный поток**, и менять то, что на экране, можно только из него. Сетевые запросы, наоборот, работают в фоне, чтобы экран не замирал. Значит, после ответа сервера нужно вернуться в главный поток и уже там обновить модель.

В Swift главный поток представлен особым актором — **главным актором**, `MainActor`. Это такая же «касса с очередью», как твой `ForecastCache`, только одна на всё приложение, и обслуживает она экран. Чтобы привязать к ней класс целиком, перед ним пишут `@MainActor`:

```swift
@MainActor
final class PlayerScreenModel {
    private(set) var trackTitle = "Ничего не играет"
    private(set) var isBuffering = false

    func play(trackId: Int) async {
        isBuffering = true                            // главный актор
        let title = await downloadTrackTitle(trackId) // ушли в фон и ждём
        trackTitle = title                            // снова главный актор
        isBuffering = false
    }
}
```

Что это даёт:

- все свойства и методы класса работают только на главном акторе. Изменить модель экрана из фона просто не получится: Swift не соберёт такой код;
- внутри методов писать ничего особенного не нужно. После `await` выполнение **само** возвращается на главный актор, поэтому строки после ожидания спокойно меняют свойства;
- сам запрос `downloadTrackTitle` при этом идёт в фоне. Главный актор ждёт его не «стоя у кассы»: пока ответа нет, он рисует экран и обрабатывает нажатия.

Код верхнего уровня в тренажёре и так работает на главном акторе. Поэтому внизу программы с моделью можно обращаться как обычно, а методы с `async` вызывать через `await`.

> 💡 Иногда на главный актор нужно попасть из обычного кода, не меняя весь класс. Для этого есть `await MainActor.run { ... }` и пометка отдельной функции: `@MainActor func showBanner()`. Но для модели экрана правило простое: весь класс — `@MainActor`.

### Задача
В редакторе есть готовый запрос `fetchTemperature(city:)`: он работает около 40 мс и бросает ошибку, если город неизвестен. Есть и заготовка класса `WeatherScreenModel` с четырьмя свойствами.

1. Отметь класс `WeatherScreenModel` как `@MainActor`.
2. Добавь в него асинхронный метод `refresh(city:)`. Параметр `city` типа `String`, результата нет, ошибок метод не бросает. По шагам:
   - включи загрузку: `isLoading` становится `true`, а старая ошибка убирается — `errorMessage` становится `nil`;
   - дождись `fetchTemperature(city:)`;
   - получилось — в `title` положи название города, в `temperatureText` — температуру текстом, например `"14"` или `"-3"`;
   - ошибка — в `errorMessage` положи `Не удалось обновить погоду`. Заголовок и температуру **не трогай**: пусть на экране останутся последние известные данные;
   - в любом случае в конце выключи загрузку.

### Пример
```swift
let screen = WeatherScreenModel()
await screen.refresh(city: "Казань")
screen.title             // "Казань"
screen.temperatureText   // "-3"
screen.isLoading         // false
```

Вывод программы:

```text
Сочи: 14
Не удалось обновить погоду
Сочи: 14
```

## @starter
```swift
enum WeatherError: Error {
    case cityNotFound
}

// Сервер погоды (заглушка): отвечает примерно через 40 мс и работает в фоне.
func fetchTemperature(city: String) async throws -> Int {
    try await Task.sleep(for: .milliseconds(40))
    let serverData = ["Москва": 5, "Сочи": 14, "Казань": -3, "Мурманск": 0]
    guard let temperature = serverData[city] else {
        throw WeatherError.cityNotFound
    }
    return temperature
}

// Модель экрана погоды: всё, что сейчас нарисовано на экране.
// 1. Отметь класс так, чтобы он работал только на главном акторе
final class WeatherScreenModel {
    private(set) var title = "Горизонт"           // заголовок: название города
    private(set) var temperatureText = "--"       // крупная цифра температуры
    private(set) var isLoading = false            // крутится ли значок загрузки
    private(set) var errorMessage: String? = nil  // текст красной плашки

    // 2. Напиши метод refresh(city:)

}

// Проба: удачное обновление, потом неудачное
let screen = WeatherScreenModel()
await screen.refresh(city: "Сочи")
print("\(screen.title): \(screen.temperatureText)")
await screen.refresh(city: "Тверь")
print(screen.errorMessage ?? "Ошибок нет")
print("\(screen.title): \(screen.temperatureText)")
```

## @solution
```swift
enum WeatherError: Error {
    case cityNotFound
}

// Сервер погоды (заглушка): отвечает примерно через 40 мс и работает в фоне.
func fetchTemperature(city: String) async throws -> Int {
    try await Task.sleep(for: .milliseconds(40))
    let serverData = ["Москва": 5, "Сочи": 14, "Казань": -3, "Мурманск": 0]
    guard let temperature = serverData[city] else {
        throw WeatherError.cityNotFound
    }
    return temperature
}

// Модель экрана погоды: всё, что сейчас нарисовано на экране.
// 1. Отметь класс так, чтобы он работал только на главном акторе
@MainActor
final class WeatherScreenModel {
    private(set) var title = "Горизонт"           // заголовок: название города
    private(set) var temperatureText = "--"       // крупная цифра температуры
    private(set) var isLoading = false            // крутится ли значок загрузки
    private(set) var errorMessage: String? = nil  // текст красной плашки

    // 2. Напиши метод refresh(city:)
    func refresh(city: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let temperature = try await fetchTemperature(city: city)
            title = city
            temperatureText = "\(temperature)"
        } catch {
            errorMessage = "Не удалось обновить погоду"
        }
        isLoading = false
    }
}

// Проба: удачное обновление, потом неудачное
let screen = WeatherScreenModel()
await screen.refresh(city: "Сочи")
print("\(screen.title): \(screen.temperatureText)")
await screen.refresh(city: "Тверь")
print(screen.errorMessage ?? "Ошибок нет")
print("\(screen.title): \(screen.temperatureText)")
```

## @output
```
Сочи: 14
Не удалось обновить погоду
Сочи: 14
```

## @tests
```swift
let __t_model = WeatherScreenModel()
__eq("Новый экран: заголовок по умолчанию", __t_model.title, "Горизонт")
__eq("Новый экран: вместо температуры прочерк", __t_model.temperatureText, "--")

await __t_model.refresh(city: "Казань")
__eq("Казань: заголовок", __t_model.title, "Казань", hint: "После удачной загрузки в title кладётся название города")
__eq("Казань: температура текстом", __t_model.temperatureText, "-3", hint: "В temperatureText — температура, превращённая в текст: \"\\(temperature)\"")
__eq("Казань: загрузка закончилась", __t_model.isLoading, false, hint: "В конце refresh выключи загрузку: isLoading = false")
__eq("Казань: ошибки нет", __t_model.errorMessage, nil)

let __t_loading = Task { await __t_model.refresh(city: "Мурманск") }
try? await Task.sleep(for: .milliseconds(15))
__eq("Пока сервер отвечает, крутится значок загрузки", __t_model.isLoading, true, hint: "isLoading = true нужно поставить до запроса, а false — только после него")
await __t_loading.value
__eq("Мурманск: ноль градусов", __t_model.temperatureText, "0")
__eq("Мурманск: значок загрузки исчез", __t_model.isLoading, false)

await __t_model.refresh(city: "Тверь")
__eq("Неизвестный город: текст ошибки", __t_model.errorMessage, "Не удалось обновить погоду", hint: "Если fetchTemperature бросила ошибку, положи текст в errorMessage")
__eq("Неизвестный город: заголовок прежний", __t_model.title, "Мурманск", hint: "При ошибке title и temperatureText не меняются — на экране остаются последние данные")
__eq("Неизвестный город: температура прежняя", __t_model.temperatureText, "0", hint: "При ошибке temperatureText не меняется")
__eq("Неизвестный город: загрузка всё равно выключена", __t_model.isLoading, false, hint: "isLoading = false должно выполниться и после ошибки — поставь эту строку после do/catch")

let __t_retry = Task { await __t_model.refresh(city: "Москва") }
try? await Task.sleep(for: .milliseconds(15))
__eq("Повторная попытка: старая ошибка убрана сразу, ещё во время загрузки", __t_model.errorMessage, nil, hint: "В начале refresh, вместе с isLoading = true, сбрось errorMessage в nil")
await __t_retry.value
__eq("Повторная попытка: Москва загрузилась", __t_model.title, "Москва")
__eq("Повторная попытка: температура", __t_model.temperatureText, "5")
```

## @rules
- must: /@MainActor\s+(final\s+)?class\s+WeatherScreenModel\b/ :: Отметь класс модели экрана: `@MainActor` перед `final class WeatherScreenModel`.
- must: /try\s+await\s+fetchTemperature\s*\(/ :: Температуру нужно получить от сервера: `try await fetchTemperature(city: city)` внутри `do`.
- mustnot: /MainActor\.run|DispatchQueue/ :: Класс уже работает на главном акторе — `MainActor.run` и очереди здесь не нужны.

## @hint1
Сначала одна строка: над объявлением класса поставь `@MainActor`. Всё, что внутри класса, теперь живёт на главном акторе.

Теперь метод `refresh`. Он асинхронный, но без `throws`: ошибку он ловит сам и показывает плашку. Первые две строки — включить загрузку и убрать старую ошибку. Это нужно сделать до запроса, чтобы значок закрутился сразу.

Дальше `do`. В нём — запрос температуры через `try await` и две строки, которые меняют заголовок и цифру. Цифру превращают в текст интерполяцией. В `catch` — только текст ошибки: заголовок и температуру не трогаешь.

Последняя строка метода, уже после `do`/`catch`, выключает загрузку. Она стоит снаружи, поэтому выполнится в обоих случаях — и при удаче, и при ошибке.

## @hint2
Модель экрана на главном акторе с асинхронным методом:

```swift
@MainActor
final class PlayerScreenModel {
    private(set) var trackTitle = "Ничего не играет"
    private(set) var isBuffering = false

    func play(trackId: Int) async {
        isBuffering = true
        let title = await downloadTrackTitle(trackId)
        trackTitle = title
        isBuffering = false
    }
}
```

У тебя запрос может бросить ошибку, поэтому середина метода обёрнута в `do` / `catch`, а выключение загрузки стоит после них.

## @hint3
Заполни пропуски:

```swift
___
final class WeatherScreenModel {
    private(set) var title = "Горизонт"
    private(set) var temperatureText = "--"
    private(set) var isLoading = false
    private(set) var errorMessage: String? = nil

    func refresh(city: String) async {
        isLoading = true
        errorMessage = ___
        do {
            let temperature = try await fetchTemperature(city: city)
            title = city
            temperatureText = "\(temperature)"
        } catch {
            errorMessage = "Не удалось обновить погоду"
        }
        ___
    }
}
```

В первом пропуске — пометка главного актора. Во втором — «ошибки нет». В третьем — выключение значка загрузки.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `@MainActor` привязывает весь класс к главному актору: его свойства можно читать и менять только оттуда, где рисуется экран. Метод `refresh` начинается на главном акторе и сразу включает значок загрузки. На строке `try await fetchTemperature(city: city)` он отпускает главный актор: запрос идёт в фоне, а экран продолжает жить. Когда ответ пришёл, выполнение **возвращается на главный актор**, и следующие строки безопасно меняют заголовок и цифру. Никаких переключений вручную писать не пришлось — это сделал Swift.

**Почему `isLoading = false` после `do`/`catch`.** Значок должен исчезнуть в любом случае. Если поставить эту строку внутри `do`, при ошибке он будет крутиться вечно — ровно то, что было на видео тестировщицы. Строка после обоих блоков выполняется и после удачи, и после ошибки.

**Почему при ошибке заголовок и цифра не меняются.** Человек в метро обновил погоду, а связи нет. Лучше показать прошлые `14` и плашку «Не удалось обновить погоду», чем пустой экран с прочерками. Последние известные данные полезнее, чем ничего.

**Почему `errorMessage = nil` в самом начале.** Если прошлое обновление закончилось ошибкой, плашка висит на экране. Человек нажал «Обновить» — плашка должна исчезнуть сразу, а не после ответа сервера.

**Типичные ошибки:**

- `@MainActor` забыт — сейчас код соберётся, но модель экрана можно будет поменять из любой фоновой задачи. В режиме Swift 6 это стало бы ошибкой компиляции;
- `isLoading = false` стоит в конце `do` — после ошибки значок не исчезнет;
- `title = city` написано до запроса — при ошибке заголовок уже поменяется на город, для которого нет данных;
- `try await` без `do` — метод тогда должен быть `throws`, а экрану нужна плашка, а не ошибка.
