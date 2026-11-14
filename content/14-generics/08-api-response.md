---
title: Обёртка ответа
concept: Обобщённое перечисление и обобщённый метод map
---

## @description

### Контекст
Сервер студии отвечает на любой запрос одинаково: либо данные, либо «ничего не найдено», либо ошибка с кодом и текстом. Данные при этом бывают какими угодно: число непрочитанных сообщений, список треков, профиль. Каждое приложение описывало такой ответ своим перечислением, и все они были на одно лицо.

Тимлид: «Сделаем в "Каркасе" одно обобщённое перечисление `ApiResponse`. И обязательно метод `map`. Экрану обычно нужны не сырые данные, а то, что из них получается: из профиля — строка с логином, из числа — текст для значка. Ответ нужно уметь превратить, не потеряв ошибку».

### Новое в Swift
**Обобщённое перечисление.** Параметр типа можно объявить и у `enum`. Тогда связанное значение варианта может иметь этот тип. Ты уже знаешь два таких перечисления: `Optional` (вариант `some` хранит значение любого типа) и `Result` из модуля про ошибки.

Пример: настройка в приложении, которую пользователь либо оставил по умолчанию, либо задал сам. Настройкой может быть громкость, тема, язык:

```swift
enum Setting<Value> {
    case systemDefault
    case custom(Value)
}

let volume: Setting<Int> = .custom(70)
let theme: Setting<String> = .systemDefault
```

У варианта `systemDefault` связанного значения нет, поэтому Swift не может угадать `Value` по нему. Тип указывают явно: `Setting<String>`.

**Обобщённый метод.** У метода может быть свой параметр типа — в дополнение к параметру всего перечисления. Так устроен `map`: он получает замыкание, которое превращает `Value` в какой-то новый тип, и возвращает настройку уже с этим новым типом:

```swift
extension Setting {
    func map<NewValue>(_ transform: (Value) -> NewValue) -> Setting<NewValue> {
        switch self {
        case .systemDefault:
            return .systemDefault
        case .custom(let value):
            return .custom(transform(value))
        }
    }
}

let label = volume.map { "Громкость \($0)%" }   // Setting<String>: .custom("Громкость 70%")
let same = theme.map { $0.uppercased() }        // Setting<String>: .systemDefault
```

`NewValue` выбирается при каждом вызове — по тому, что возвращает замыкание. Замыкание вызывается, только если внутри есть значение.

> ⚠️ Вернуть `self` из `map` нельзя, даже для варианта без значения. `self` — это `Setting<Value>`, а метод обещает `Setting<NewValue>`. Это разные типы, поэтому вариант создаётся заново: `return .systemDefault`.

Внутри перечисления в `switch self` можно написать вариант без разбора значений, если они не нужны: `case .custom:`.

### Задача
В редакторе есть заготовка `ApiResponse`. Сделай её обобщённой с параметром типа `Payload` и допиши.

1. Три варианта:
   - `success` — со связанным значением типа `Payload`;
   - `empty` — без значения;
   - `failure` — с двумя связанными значениями: `code` типа `Int` и `message` типа `String`.
2. Вычисляемое свойство `payload` типа `Payload?`: данные для `success`, иначе `nil`.
3. Вычисляемое свойство `statusText` типа `String`:
   - для `success` — `Готово`;
   - для `empty` — `Ничего не найдено`;
   - для `failure` — `Ошибка `, код, двоеточие, пробел и текст ошибки: `Ошибка 404: Профиль не найден`.
4. Метод `map(_:)` со своим параметром типа `NewPayload`. Принимает замыкание `(Payload) -> NewPayload` и возвращает `ApiResponse<NewPayload>`:
   - `success` — с данными, превращёнными замыканием;
   - `empty` — снова `empty`;
   - `failure` — с теми же кодом и текстом.

   Замыкание вызывается только для `success`.

### Пример
```swift
let unread: ApiResponse<Int> = .success(3)
let badge = unread.map { "Непрочитанных: \($0)" }   // ApiResponse<String>
badge.payload       // "Непрочитанных: 3"
badge.statusText    // "Готово"

let broken: ApiResponse<Int> = .failure(code: 503, message: "Сервер недоступен")
broken.map { "Непрочитанных: \($0)" }.statusText   // "Ошибка 503: Сервер недоступен"
broken.payload      // nil

let nothing: ApiResponse<[String]> = .empty
nothing.map { $0.count }.statusText   // "Ничего не найдено"
```

## @starter
```swift
// Ответ сервера с данными любого типа.
// Добавь параметр типа Payload
enum ApiResponse {
    // 1. Варианты ответа: данные, пусто, ошибка с кодом и текстом


    // 2. Данные, если они есть


    // 3. Текст статуса для экрана


    // 4. Превратить данные, сохранив пустой ответ и ошибку

}
```

## @solution
```swift
// Ответ сервера с данными любого типа.
// Добавь параметр типа Payload
enum ApiResponse<Payload> {
    // 1. Варианты ответа: данные, пусто, ошибка с кодом и текстом
    case success(Payload)
    case empty
    case failure(code: Int, message: String)

    // 2. Данные, если они есть
    var payload: Payload? {
        if case .success(let payload) = self {
            return payload
        }
        return nil
    }

    // 3. Текст статуса для экрана
    var statusText: String {
        switch self {
        case .success:
            return "Готово"
        case .empty:
            return "Ничего не найдено"
        case .failure(let code, let message):
            return "Ошибка \(code): \(message)"
        }
    }

    // 4. Превратить данные, сохранив пустой ответ и ошибку
    func map<NewPayload>(_ transform: (Payload) -> NewPayload) -> ApiResponse<NewPayload> {
        switch self {
        case .success(let payload):
            return .success(transform(payload))
        case .empty:
            return .empty
        case .failure(let code, let message):
            return .failure(code: code, message: message)
        }
    }
}
```

## @tests
```swift
func __t_describe<P>(_ response: ApiResponse<P>) -> String {
    switch response {
    case .success(let payload):
        return "success(\(payload))"
    case .empty:
        return "empty"
    case .failure(let code, let message):
        return "failure(\(code), \(message))"
    }
}

let __t_unread: ApiResponse<Int> = .success(3)
let __t_empty: ApiResponse<Int> = .empty
let __t_broken: ApiResponse<Int> = .failure(code: 503, message: "Сервер недоступен")

__eq("payload: данные из success", __t_unread.payload, 3)
__eq("payload: у empty данных нет", __t_empty.payload == nil, true, hint: "Для empty и failure свойство payload возвращает nil")
__eq("payload: у failure данных нет", __t_broken.payload == nil, true)
let __t_tracks: ApiResponse<[String]> = .success(["Море", "Осень"])
__eq("payload: массив треков", __t_tracks.payload, ["Море", "Осень"])

__eq("statusText: success", __t_unread.statusText, "Готово")
__eq("statusText: empty", __t_empty.statusText, "Ничего не найдено")
__eq("statusText: failure 503", __t_broken.statusText, "Ошибка 503: Сервер недоступен", hint: "Формат: Ошибка, пробел, код, двоеточие, пробел, текст ошибки")
__eq("statusText: failure 404 с другим текстом", ApiResponse<String>.failure(code: 404, message: "Профиль не найден").statusText, "Ошибка 404: Профиль не найден", hint: "Код и текст бери из связанных значений варианта failure")

let __t_badge = __t_unread.map { "Непрочитанных: \($0)" }
__eq("map: Int превратился в String", __t_describe(__t_badge), "success(Непрочитанных: 3)")
let __t_badgeText: String? = __t_badge.payload
__eq("map: результат — ApiResponse<String>", __t_badgeText, "Непрочитанных: 3", hint: "map должен возвращать ApiResponse<NewPayload>, где NewPayload — тип, который вернуло замыкание")
__eq("map: empty остаётся empty", __t_describe(__t_empty.map { "Непрочитанных: \($0)" }), "empty")
__eq("map: failure сохраняет код и текст", __t_describe(__t_broken.map { "Непрочитанных: \($0)" }), "failure(503, Сервер недоступен)", hint: "Для failure верни новый failure с теми же code и message")
__eq("map: statusText ошибки после map не изменился", __t_broken.map { $0 * 2 }.statusText, "Ошибка 503: Сервер недоступен")

var __t_calls = 0
_ = __t_empty.map { (value: Int) -> Int in
    __t_calls += 1
    return value
}
_ = __t_broken.map { (value: Int) -> Int in
    __t_calls += 1
    return value
}
__eq("map: для empty и failure замыкание не вызывается", __t_calls, 0, hint: "Вызывай transform только внутри ветки success — у других вариантов нет данных")
_ = __t_unread.map { (value: Int) -> Int in
    __t_calls += 1
    return value
}
__eq("map: для success замыкание вызывается ровно один раз", __t_calls, 1)

struct __t_Profile {
    let login: String
    let followers: Int
}
let __t_profile: ApiResponse<__t_Profile> = .success(__t_Profile(login: "bilol", followers: 120))
__eq("map со структурой проверки: профиль в логин", __t_profile.map { $0.login }.payload, "bilol", hint: "ApiResponse должен работать с данными любого типа, в том числе со структурами, которых нет в твоём коде")
__eq("map дважды подряд: профиль, затем число подписчиков, затем текст", __t_describe(__t_profile.map { $0.followers }.map { "Подписчиков: \($0)" }), "success(Подписчиков: 120)")
let __t_noProfile: ApiResponse<__t_Profile> = .failure(code: 404, message: "Профиль не найден")
__eq("map со структурой проверки: ошибка 404 дошла до экрана", __t_noProfile.map { $0.login }.statusText, "Ошибка 404: Профиль не найден")
```

## @rules
- must: /enum\s+ApiResponse\s*<\s*Payload\s*>/ :: Объяви у перечисления параметр типа `Payload`: `enum ApiResponse<Payload>`.
- must: /func\s+map\s*<\s*NewPayload\s*>/ :: У метода `map` должен быть свой параметр типа: `func map<NewPayload>(...)`.

## @hint1
Начни с объявления: после имени перечисления, в угловых скобках, параметр типа `Payload`.

Варианты. У `success` в скобках одно связанное значение типа `Payload`. У `empty` скобок нет. У `failure` в скобках два значения с метками: код-число и текст.

`payload` — вычисляемое свойство с опциональным типом. Удобнее всего через `if case`: если `self` — это `success`, достань значение и верни его. Иначе верни `nil`.

`statusText` — `switch self` с тремя ветками. В ветке `success` данные не нужны, значение можно не разбирать. В ветке `failure` достань код и текст и собери строку интерполяцией.

`map` — метод с собственным параметром типа `NewPayload` в угловых скобках после слова `map`. Параметр — замыкание из `Payload` в `NewPayload`, результат — `ApiResponse` с новым типом в угловых скобках. Внутри снова `switch self`. Для `success` верни `success` с результатом замыкания. Для `empty` верни `empty`. Для `failure` создай новый `failure` с теми же кодом и текстом. `self` вернуть не получится: у него другой тип.

## @hint2
Объявление вариантов и сигнатура `map` выглядят так:

```swift
enum ApiResponse<Payload> {
    case success(Payload)
    case empty
    case failure(code: Int, message: String)

    func map<NewPayload>(_ transform: (Payload) -> NewPayload) -> ApiResponse<NewPayload> {
        // switch self с тремя ветками
    }
}
```

Данные из одного варианта удобно достать через `if case`:

```swift
if case .success(let payload) = self {
    return payload
}
```

## @hint3
Варианты и `payload` готовы. Заполни пропуски:

```swift
    var statusText: String {
        switch self {
        case .success:
            return "Готово"
        case .empty:
            return "Ничего не найдено"
        case .failure(let code, let message):
            return ___
        }
    }

    func map<NewPayload>(_ transform: (Payload) -> NewPayload) -> ___ {
        switch self {
        case .success(let payload):
            return .success(___)
        case .empty:
            return .empty
        case .failure(let code, let message):
            return .failure(code: code, message: message)
        }
    }
```

В первом пропуске — строка с кодом и текстом ошибки через интерполяцию. Во втором — тип результата: ответ с новым типом данных. В третьем — данные, превращённые замыканием.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `ApiResponse<Payload>` — одно перечисление для всех запросов. Для счётчика непрочитанных это `ApiResponse<Int>`, для списка треков — `ApiResponse<[String]>`, для профиля — `ApiResponse<Profile>`. Варианты `empty` и `failure` от `Payload` не зависят, но живут в том же перечислении: ответ сервера — это всегда одно из трёх.

`payload` пользуется `if case`: если ответ — `success`, данные достаются и возвращаются, во всех остальных случаях — `nil`. Тип результата `Payload?` подстраивается под подстановку: для `ApiResponse<Int>` это `Int?`.

**Самое интересное — `map`.** У метода свой параметр типа `NewPayload`, и Swift определяет его по замыканию. В вызове `unread.map { "Непрочитанных: \($0)" }` замыкание возвращает строку, значит, `NewPayload` — это `String`, а результат — `ApiResponse<String>`. Данные превращаются, а ошибка проходит насквозь нетронутой. Поэтому экран может написать одну цепочку и не проверять ошибку на каждом шаге: если сервер ответил 404, текст «Ошибка 404» дойдёт до экрана и после двух `map`.

**Почему ветки `empty` и `failure` создают новые значения.** `self` имеет тип `ApiResponse<Payload>`, а метод обещает `ApiResponse<NewPayload>`. Для Swift это разные типы, даже если внутри нет данных. Поэтому `return .empty` и `return .failure(code: code, message: message)` — новые значения уже нужного типа.

**Типичные ошибки:**

- `return self` в ветках `empty` или `failure` — Swift сообщит, что не может превратить `ApiResponse<Payload>` в `ApiResponse<NewPayload>`;
- замыкание вызвано до `switch` — тогда для ошибки придётся вызывать его без данных, а данных нет;
- у `failure` забыты метки: `case failure(Int, String)` — тогда создание `.failure(code: 404, message: ...)` не соберётся.
