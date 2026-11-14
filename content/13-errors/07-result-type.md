---
title: Ответ сервера
concept: Тип Result — успех или ошибка в одном значении
---

## @description

### Контекст
Баланс карты «Монета» не хранит у себя — она спрашивает его у банка. Сетевой слой устроен так же, как каталог в «Ярмарке»: запрос уходит, а ответ потом приходит в замыкание-обработчик (completion handler).

Пока настоящего банка в тестовой среде нет, команда работает с заглушкой — структурой `BankServerStub`. Она умеет изображать три неприятности: банк недоступен, у банка техработы, карты с такими цифрами нет.

Тимлид объясняет задачу: «Обработчик получает ответ, когда наша функция давно закончилась. Бросить ошибку в замыкании некому — тот, кто делал запрос, уже ушёл. Поэтому ответ мы упаковываем в значение: либо баланс, либо ошибка. Для этого в Swift есть `Result`».

### Новое в Swift
**`Result`** — это готовое перечисление из стандартной библиотеки Swift. У него ровно два случая:

- `.success(значение)` — всё получилось, внутри результат;
- `.failure(ошибка)` — не получилось, внутри ошибка.

Записывается тип так: `Result<Int, CashbackError>`. В угловых скобках мы говорим, какого типа успешное значение и какого типа ошибка. Здесь успех несёт `Int`, а неудача — `CashbackError`. Такие типы «с параметрами в угловых скобках» подробно разберём в следующем модуле. Пока достаточно читать их как подпись: «результат: число или ошибка кэшбэка».

Пример — кэшбэк за месяц, который считает банк-партнёр:

```swift
enum CashbackError: Error {
    case partnerOffline
    case notCalculatedYet(readyDay: Int)
}

let paid: Result<Int, CashbackError> = .success(340)
let early: Result<Int, CashbackError> = .failure(.notCalculatedYet(readyDay: 5))
```

**Создать** `Result` — значит выбрать случай и положить внутрь значение. Если тип уже известен, например из типа результата функции, хватает точки: `return .success(340)` или `return .failure(.partnerOffline)`.

**Прочитать** — `switch`, как любое перечисление со связанными значениями. Образцы можно вкладывать друг в друга: `.failure(.partnerOffline)` значит «неудача, а внутри именно эта ошибка».

```swift
func cashbackText(for result: Result<Int, CashbackError>) -> String {
    switch result {
    case .success(let amount):
        return "Кэшбэк за месяц: \(amount) руб."
    case .failure(.partnerOffline):
        return "Партнёр не отвечает"
    case .failure(.notCalculatedYet(let day)):
        return "Кэшбэк посчитаем \(day) числа"
    }
}
```

Swift проверит, что разобраны все варианты: и успех, и каждая ошибка. Общего `catch` здесь нет и не нужно — тип ошибки известен заранее.

**Вернуться к `throws`** помогает метод `get()`. Для успеха он возвращает значение, для неудачи — бросает ошибку, которая лежала внутри. Поэтому перед ним нужен `try`:

```swift
let amount = try paid.get()   // 340
let other = try early.get()   // бросит CashbackError.notCalculatedYet(readyDay: 5)
```

Это удобно, когда ответов несколько и на первой же ошибке нужно остановиться.

> 💡 `throws` и `Result` описывают одно и то же: «значение или ошибка». `throws` удобен, когда результат нужен сразу, прямо в месте вызова. `Result` — когда исход нужно передать в замыкание, сохранить в свойство или положить в массив.

### Задача
В редакторе есть перечисление `BankError`, структура `BankServerStub` и готовая функция `requestBalance`, которая передаёт ответ в замыкание. Не меняй их.

1. Допиши функцию `fetchBalance(cardDigits:from:)`. Она получает `String` и `BankServerStub` и возвращает `Result<Int, BankError>`. Проверки по порядку:
   1. сервер не в сети (`isOnline` равно `false`) — `.failure(.offline)`;
   2. идут техработы (`maintenanceUntil` не `nil`) — `.failure(.maintenance(until:))` с временем из `maintenanceUntil`;
   3. в словаре `balances` нет карты с такими цифрами — `.failure(.cardNotFound(lastDigits:))` с этими цифрами;
   4. иначе — `.success` с балансом карты.
2. Допиши функцию `balanceText(for:)`. Она получает `Result<Int, BankError>` и возвращает `String`:
   - успех — `Баланс: 12500 руб.`;
   - `offline` — `Нет связи с банком`;
   - `maintenance` — `Банк на техработах до 03:00` (время — из ошибки);
   - `cardNotFound` — `Карта 9999 не найдена` (цифры — из ошибки).
3. Допиши функцию `totalBalance(of:from:)`. Она получает массив цифр карт `[String]` и `BankServerStub`, помечена `throws` и возвращает `Int` — сумму балансов всех карт. Ответ по каждой карте получай через `fetchBalance` и превращай в число методом `get()`. Если хоть одна карта вернула ошибку, функция бросает эту ошибку. Для пустого массива — `0`.

### Пример
```swift
let server = BankServerStub(isOnline: true, maintenanceUntil: nil, balances: ["4417": 12500, "0925": 3000])

fetchBalance(cardDigits: "4417", from: server)    // .success(12500)
fetchBalance(cardDigits: "9999", from: server)    // .failure(.cardNotFound(lastDigits: "9999"))

balanceText(for: .success(12500))                 // "Баланс: 12500 руб."
balanceText(for: .failure(.maintenance(until: "03:00")))   // "Банк на техработах до 03:00"

try totalBalance(of: ["4417", "0925"], from: server)       // 15500
try totalBalance(of: ["4417", "9999"], from: server)       // ошибка BankError.cardNotFound(lastDigits: "9999")
```

## @starter
```swift
// Что может пойти не так при запросе к банку
enum BankError: Error, Equatable {
    case offline
    case maintenance(until: String)
    case cardNotFound(lastDigits: String)
}

// Заглушка банковского сервера для тестовой среды
struct BankServerStub {
    var isOnline: Bool
    var maintenanceUntil: String?   // до какого времени идут техработы, если идут
    var balances: [String: Int]     // последние 4 цифры карты и её баланс
}

// 1. Ответ банка на запрос баланса
func fetchBalance(cardDigits: String, from server: BankServerStub) -> Result<Int, BankError> {
    // Заглушку замени проверками по порядку
    return .failure(.offline)
}

// 2. Текст для экрана по ответу банка
func balanceText(for result: Result<Int, BankError>) -> String {
    return ""
}

// 3. Сумма балансов нескольких карт
func totalBalance(of cards: [String], from server: BankServerStub) throws -> Int {
    return 0
}

// Сетевой слой отдаёт ответ экрану в замыкании (код готов)
func requestBalance(cardDigits: String, from server: BankServerStub, completion: (Result<Int, BankError>) -> Void) {
    completion(fetchBalance(cardDigits: cardDigits, from: server))
}

let server = BankServerStub(isOnline: true, maintenanceUntil: nil, balances: ["4417": 12500, "0925": 3000])
requestBalance(cardDigits: "4417", from: server) { result in
    print(balanceText(for: result))
}
```

## @solution
```swift
// Что может пойти не так при запросе к банку
enum BankError: Error, Equatable {
    case offline
    case maintenance(until: String)
    case cardNotFound(lastDigits: String)
}

// Заглушка банковского сервера для тестовой среды
struct BankServerStub {
    var isOnline: Bool
    var maintenanceUntil: String?   // до какого времени идут техработы, если идут
    var balances: [String: Int]     // последние 4 цифры карты и её баланс
}

// 1. Ответ банка на запрос баланса
func fetchBalance(cardDigits: String, from server: BankServerStub) -> Result<Int, BankError> {
    // Заглушку замени проверками по порядку
    guard server.isOnline else {
        return .failure(.offline)
    }
    if let until = server.maintenanceUntil {
        return .failure(.maintenance(until: until))
    }
    guard let balance = server.balances[cardDigits] else {
        return .failure(.cardNotFound(lastDigits: cardDigits))
    }
    return .success(balance)
}

// 2. Текст для экрана по ответу банка
func balanceText(for result: Result<Int, BankError>) -> String {
    switch result {
    case .success(let balance):
        return "Баланс: \(balance) руб."
    case .failure(.offline):
        return "Нет связи с банком"
    case .failure(.maintenance(let until)):
        return "Банк на техработах до \(until)"
    case .failure(.cardNotFound(let digits)):
        return "Карта \(digits) не найдена"
    }
}

// 3. Сумма балансов нескольких карт
func totalBalance(of cards: [String], from server: BankServerStub) throws -> Int {
    var total = 0
    for digits in cards {
        total += try fetchBalance(cardDigits: digits, from: server).get()
    }
    return total
}

// Сетевой слой отдаёт ответ экрану в замыкании (код готов)
func requestBalance(cardDigits: String, from server: BankServerStub, completion: (Result<Int, BankError>) -> Void) {
    completion(fetchBalance(cardDigits: cardDigits, from: server))
}

let server = BankServerStub(isOnline: true, maintenanceUntil: nil, balances: ["4417": 12500, "0925": 3000])
requestBalance(cardDigits: "4417", from: server) { result in
    print(balanceText(for: result))
}
```

## @tests
```swift
func __t_show(_ result: Result<Int, BankError>) -> String {
    switch result {
    case .success(let value):
        return "success(\(value))"
    case .failure(let error):
        return "failure(\(error))"
    }
}

func __t_total(_ cards: [String], _ server: BankServerStub) -> String {
    do {
        let total = try totalBalance(of: cards, from: server)
        return "сумма \(total)"
    } catch let error as BankError {
        return "ошибка \(error)"
    } catch {
        return "посторонняя ошибка \(error)"
    }
}

let __t_ok = BankServerStub(isOnline: true, maintenanceUntil: nil, balances: ["4417": 12500, "0925": 3000, "5150": 0])
let __t_down = BankServerStub(isOnline: false, maintenanceUntil: nil, balances: ["4417": 12500])
let __t_night = BankServerStub(isOnline: true, maintenanceUntil: "03:00", balances: ["4417": 12500])
let __t_morning = BankServerStub(isOnline: true, maintenanceUntil: "05:30", balances: [:])
let __t_both = BankServerStub(isOnline: false, maintenanceUntil: "03:00", balances: ["4417": 12500])

__eq("Ответ: карта 4417 найдена", __t_show(fetchBalance(cardDigits: "4417", from: __t_ok)), "success(12500)", hint: "Если всё в порядке, верни .success с балансом из словаря balances")
__eq("Ответ: карта 0925 найдена", __t_show(fetchBalance(cardDigits: "0925", from: __t_ok)), "success(3000)")
__eq("Ответ: на карте 0 руб. — это тоже успех", __t_show(fetchBalance(cardDigits: "5150", from: __t_ok)), "success(0)", hint: "Нулевой баланс — это не ошибка")
__eq("Ответ: карты нет", __t_show(fetchBalance(cardDigits: "9999", from: __t_ok)), "failure(cardNotFound(lastDigits: \"9999\"))", hint: "Если словарь не вернул баланс, верни .failure(.cardNotFound(lastDigits: cardDigits))")
__eq("Ответ: банк не в сети", __t_show(fetchBalance(cardDigits: "4417", from: __t_down)), "failure(offline)", hint: "Сначала проверь server.isOnline")
__eq("Ответ: техработы до 03:00", __t_show(fetchBalance(cardDigits: "4417", from: __t_night)), "failure(maintenance(until: \"03:00\"))", hint: "Если maintenanceUntil не nil, верни .failure(.maintenance(until:)) с этим временем")
__eq("Ответ: техработы до 05:30 важнее отсутствия карты", __t_show(fetchBalance(cardDigits: "1111", from: __t_morning)), "failure(maintenance(until: \"05:30\"))", hint: "Порядок проверок: сеть, техработы, карта")
__eq("Ответ: нет сети важнее техработ", __t_show(fetchBalance(cardDigits: "4417", from: __t_both)), "failure(offline)", hint: "Порядок проверок: сеть, техработы, карта")

__eq("Текст: баланс 12500 руб.", balanceText(for: .success(12500)), "Баланс: 12500 руб.")
__eq("Текст: баланс 0 руб.", balanceText(for: .success(0)), "Баланс: 0 руб.")
__eq("Текст: нет сети", balanceText(for: .failure(.offline)), "Нет связи с банком")
__eq("Текст: техработы до 05:30", balanceText(for: .failure(.maintenance(until: "05:30"))), "Банк на техработах до 05:30", hint: "Время возьми из ошибки: case .failure(.maintenance(let until))")
__eq("Текст: карта 1111 не найдена", balanceText(for: .failure(.cardNotFound(lastDigits: "1111"))), "Карта 1111 не найдена", hint: "Цифры возьми из ошибки: case .failure(.cardNotFound(let digits))")

__eq("Сумма: две карты", __t_total(["4417", "0925"], __t_ok), "сумма 15500", hint: "Сложи балансы всех карт: для каждой fetchBalance(...).get()")
__eq("Сумма: одна карта", __t_total(["0925"], __t_ok), "сумма 3000")
__eq("Сумма: пустой список", __t_total([], __t_ok), "сумма 0")
__eq("Сумма: одной карты нет — ошибка", __t_total(["4417", "9999"], __t_ok), "ошибка cardNotFound(lastDigits: \"9999\")", hint: "get() бросит ошибку из Result. Не лови её внутри totalBalance — пусть выходит наружу")
__eq("Сумма: банк не в сети — ошибка", __t_total(["4417"], __t_down), "ошибка offline")
__eq("Сумма: техработы — ошибка", __t_total(["4417", "4417"], __t_night), "ошибка maintenance(until: \"03:00\")")
```

## @rules
- must: /\.get\s*\(\s*\)/ :: В `totalBalance` превращай ответ в число методом `get()`: `try fetchBalance(...).get()`.
- must: /\.success\s*\(/ :: В `fetchBalance` упакуй баланс в `.success(...)`.

## @hint1
`fetchBalance` — четыре шага сверху вниз. Первый: если сервер не в сети, верни неудачу с ошибкой `offline`. Это удобно записать через `guard`. Второй: если в `maintenanceUntil` есть время, разверни его через `if let` и верни неудачу с ошибкой о техработах. Третий: достань баланс из словаря `balances` по цифрам карты через `guard let`. Если его нет, верни неудачу с ошибкой о ненайденной карте. Четвёртый: верни успех с балансом.

`balanceText` — один `switch` по `result` и четыре случая. Один для успеха, где достаётся баланс, и по одному на каждую ошибку. Образцы ошибок вкладываются в `.failure(...)`. Там, где в ошибке есть значение, достань его через `let`.

`totalBalance` — переменная-сумма и цикл по картам. Для каждой карты вызови `fetchBalance`, а у результата сразу метод `get()`, с `try` в начале. Прибавь полученное число к сумме. Ловить ничего не надо: функция помечена `throws`.

## @hint2
Создание и чтение `Result` — на примере кэшбэка:

```swift
func cashback(isReady: Bool) -> Result<Int, CashbackError> {
    guard isReady else {
        return .failure(.notCalculatedYet(readyDay: 5))
    }
    return .success(340)
}

switch result {
case .success(let amount):
    print("Кэшбэк: \(amount) руб.")
case .failure(.partnerOffline):
    print("Партнёр не отвечает")
case .failure(.notCalculatedYet(let day)):
    print("Посчитаем \(day) числа")
}

let amount = try cashback(isReady: true).get()
```

## @hint3
Осталось заполнить пропуски:

```swift
func fetchBalance(cardDigits: String, from server: BankServerStub) -> Result<Int, BankError> {
    guard server.isOnline else {
        return .failure(.offline)
    }
    if let until = server.maintenanceUntil {
        return .failure(___)
    }
    guard let balance = server.balances[cardDigits] else {
        return .failure(.cardNotFound(lastDigits: cardDigits))
    }
    return ___
}

func balanceText(for result: Result<Int, BankError>) -> String {
    switch result {
    case .success(let balance):
        return "Баланс: \(balance) руб."
    case .failure(.offline):
        return "Нет связи с банком"
    case .failure(.maintenance(let until)):
        return "Банк на техработах до \(until)"
    case ___:
        return "Карта \(digits) не найдена"
    }
}

func totalBalance(of cards: [String], from server: BankServerStub) throws -> Int {
    var total = 0
    for digits in cards {
        total += ___ fetchBalance(cardDigits: digits, from: server).___
    }
    return total
}
```

По порядку: ошибка техработ с временем; успех с балансом; образец для ненайденной карты с константой `digits`; слово перед бросающим вызовом; метод, превращающий `Result` в значение.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `fetchBalance` ничего не бросает — она **возвращает** исход. Каждая проверка заканчивается `return .failure(...)` с нужной ошибкой, а если всё хорошо, возвращается `.success(balance)`. Тип результата известен из объявления функции, поэтому хватает точки: `.failure(.offline)` вместо `Result<Int, BankError>.failure(BankError.offline)`.

`balanceText` разбирает `Result` через `switch` с вложенными образцами. `.failure(.maintenance(let until))` читается так: «неудача, внутри ошибка техработ, а время из неё положи в `until`». Swift проверяет, что разобраны все четыре варианта, поэтому `default` не нужен. Если в `BankError` добавят новый случай, код перестанет собираться, пока для него не напишут текст. Так никто не забудет про новую ошибку.

`totalBalance` показывает обратное превращение. `get()` достаёт число из успеха или бросает ошибку из неудачи. Ошибка выходит из цикла и из функции — так же, как в цепочке оплаты.

**Зачем `Result`, если есть `throws`.** Посмотри на `requestBalance` внизу: ответ передаётся в замыкание. Ошибку туда не бросишь, а значение передать можно. `Result` и есть такое значение: «баланс или ошибка», которое можно передать, сохранить и разобрать потом.

**Типичные ошибки:**

- `case .failure(let error)` и дальше `if` — работает, но длиннее и без проверки, что разобраны все ошибки;
- `total += fetchBalance(...).get()` без `try` — `get()` может бросить ошибку, и Swift требует это отметить;
- проверка карты стоит раньше техработ — во время техработ банк ответит не той ошибкой.
