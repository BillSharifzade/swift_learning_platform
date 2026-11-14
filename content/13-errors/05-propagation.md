---
title: Цепочка операций
concept: Проброс ошибок через throws, catch let ... as, rethrows (обзорно)
---

## @description

### Контекст
Оплата заказа в «Монете» — это не одно действие, а цепочка шагов. Сначала проверяется карта: не заблокирована ли, не истёк ли срок. Потом дневной лимит. И только потом деньги списываются. На любом шаге что-то может пойти не так, и тогда следующие шаги выполняться не должны.

Первые два шага коллега уже написал: `validateCard` и `checkDailyLimit`. Он же добавил к ошибкам свойство `userMessage` с понятным текстом для каждой. Тебе осталось списание, сама цепочка и экран.

Тимлид объясняет устройство: «Шаги ничего не знают про экран. Они только бросают ошибки. Цепочка их не ловит, а пропускает наверх. Ловит один экран — в одном месте, сразу для всех шагов».

### Новое в Swift
До сих пор каждую ошибку ловили прямо там, где вызывали бросающую функцию. Но ловить на месте не обязательно. Ошибку можно **пробросить** — передать тому, кто вызвал тебя.

Пример на других данных — привязка новой карты:

```swift
enum LinkError: Error {
    case wrongNumberLength
    case foreignCard
}

func checkNumber(_ number: String) throws {
    guard number.count == 16 else {
        throw LinkError.wrongNumberLength
    }
}

func checkCountry(_ country: String) throws {
    guard country == "RU" else {
        throw LinkError.foreignCard
    }
}

func linkCard(number: String, country: String) throws -> String {
    try checkNumber(number)
    try checkCountry(country)
    return "Карта привязана"
}
```

Внутри `linkCard` нет ни одного `do-catch`, только `try`. Если `checkNumber` бросит ошибку, `linkCard` остановится прямо на этой строке. До проверки страны дело не дойдёт. А та же самая ошибка уйдёт дальше — тому, кто вызвал `linkCard`.

Правила простые:

- `try` без `do-catch` можно писать только внутри функции с `throws`. Так функция честно предупреждает: «я сама не ловлю, ошибка может выйти из меня».
- Ошибка поднимается по цепочке вызовов, пока её кто-нибудь не поймает.

**Ловим наверху.** Экрану обычно не важно, на каком шаге случилась ошибка. Ему важно, что это за ошибка. Поймать **любую** ошибку нужного типа можно так:

```swift
do {
    let text = try linkCard(number: "1234", country: "RU")
    print(text)
} catch let error as LinkError {
    print("Не удалось привязать карту: \(error)")
} catch {
    print("Неизвестная ошибка")
}
```

`catch let error as LinkError` работает как `as?` из «Гнезда». Если пойманная ошибка — это `LinkError`, она попадает в константу `error`, уже с типом `LinkError`. Значит, у неё можно читать свойства этого типа. Ошибки других типов пойдут в следующий `catch`.

> 💡 Бросать умеют и замыкания. `map`, `filter` и другие методы объявлены со словом `rethrows`: «я брошу ошибку, только если её бросит замыкание, которое ты мне передала». Поэтому с обычным замыканием `try` не нужен, а с бросающим — нужен: `let checked = try numbers.map { try normalized($0) }`. Своих `rethrows`-функций в этом модуле писать не придётся.

### Задача
В редакторе уже есть перечисление `CheckoutError` со свойством `userMessage`, структура `Card` и два готовых шага: `validateCard(_:currentYear:)` и `checkDailyLimit(amount:spentToday:)`. Не меняй их.

1. Допиши шаг 3 — функцию `charge(_:from:)`. Она получает сумму `Int` и карту `Card`, помечена `throws` и возвращает `Int` — баланс карты после списания. Если сумма больше баланса карты, брось `CheckoutError.insufficientFunds`, где `missing` — сколько не хватает.
2. Допиши функцию `checkout(amount:card:spentToday:currentYear:)`. Параметры — `Int`, `Card`, `Int`, `Int`. Функция помечена `throws` и возвращает `Int`. Она по порядку вызывает три шага: `validateCard`, `checkDailyLimit`, `charge`, и возвращает результат `charge`. Ошибки внутри **не лови** — пусть уходят наверх.
3. Допиши функцию `checkoutMessage(amount:card:spentToday:currentYear:)` с теми же параметрами. Она возвращает `String`:
   - если `checkout` прошла — `Оплачено картой 4417. Остаток: 2500 руб.` (номер — `lastDigits` карты, остаток — результат `checkout`);
   - если брошена `CheckoutError` — её `userMessage`;
   - любая другая ошибка — `Оплата не прошла`.

### Пример
```swift
let card = Card(lastDigits: "4417", isBlocked: false, expiryYear: 2028, balance: 5000)

try checkout(amount: 2500, card: card, spentToday: 0, currentYear: 2026)
// 2500

try checkout(amount: 2500, card: card, spentToday: 99000, currentYear: 2026)
// ошибка CheckoutError.dailyLimitExceeded(left: 1000) — брошена в шаге 2

checkoutMessage(amount: 2500, card: card, spentToday: 0, currentYear: 2026)
// "Оплачено картой 4417. Остаток: 2500 руб."

checkoutMessage(amount: 7000, card: card, spentToday: 0, currentYear: 2026)
// "Не хватает 2000 руб." — брошена в шаге 3, поймана на экране
```

## @starter
```swift
// Почему оплата заказа не прошла
enum CheckoutError: Error {
    case cardBlocked
    case cardExpired(year: Int)
    case dailyLimitExceeded(left: Int)
    case insufficientFunds(missing: Int)
}

// Понятный текст для каждой ошибки (готово)
extension CheckoutError {
    var userMessage: String {
        switch self {
        case .cardBlocked:
            return "Карта заблокирована"
        case .cardExpired(let year):
            return "Срок действия карты закончился в \(year) году"
        case .dailyLimitExceeded(let left):
            return "Превышен дневной лимит. Сегодня можно потратить ещё \(left) руб."
        case .insufficientFunds(let missing):
            return "Не хватает \(missing) руб."
        }
    }
}

// Карта покупателя
struct Card {
    let lastDigits: String
    let isBlocked: Bool
    let expiryYear: Int
    let balance: Int
}

// Шаг 1. Карта действует (готово)
func validateCard(_ card: Card, currentYear: Int) throws {
    guard !card.isBlocked else {
        throw CheckoutError.cardBlocked
    }
    guard card.expiryYear >= currentYear else {
        throw CheckoutError.cardExpired(year: card.expiryYear)
    }
}

// Шаг 2. Дневной лимит не превышен (готово)
func checkDailyLimit(amount: Int, spentToday: Int) throws {
    let dailyLimit = 100000
    guard spentToday + amount <= dailyLimit else {
        throw CheckoutError.dailyLimitExceeded(left: dailyLimit - spentToday)
    }
}

// Шаг 3. Списание: вернуть баланс после списания или сообщить, сколько не хватает
func charge(_ amount: Int, from card: Card) throws -> Int {
    return 0
}

// Вся оплата: шаги 1, 2 и 3 по порядку. Ошибки здесь не ловим — пробрасываем
func checkout(amount: Int, card: Card, spentToday: Int, currentYear: Int) throws -> Int {
    return 0
}

// Экран оплаты: здесь ошибки ловим и превращаем в текст
func checkoutMessage(amount: Int, card: Card, spentToday: Int, currentYear: Int) -> String {
    return ""
}

let card = Card(lastDigits: "4417", isBlocked: false, expiryYear: 2028, balance: 5000)
print(checkoutMessage(amount: 2500, card: card, spentToday: 0, currentYear: 2026))
print(checkoutMessage(amount: 7000, card: card, spentToday: 0, currentYear: 2026))
```

## @solution
```swift
// Почему оплата заказа не прошла
enum CheckoutError: Error {
    case cardBlocked
    case cardExpired(year: Int)
    case dailyLimitExceeded(left: Int)
    case insufficientFunds(missing: Int)
}

// Понятный текст для каждой ошибки (готово)
extension CheckoutError {
    var userMessage: String {
        switch self {
        case .cardBlocked:
            return "Карта заблокирована"
        case .cardExpired(let year):
            return "Срок действия карты закончился в \(year) году"
        case .dailyLimitExceeded(let left):
            return "Превышен дневной лимит. Сегодня можно потратить ещё \(left) руб."
        case .insufficientFunds(let missing):
            return "Не хватает \(missing) руб."
        }
    }
}

// Карта покупателя
struct Card {
    let lastDigits: String
    let isBlocked: Bool
    let expiryYear: Int
    let balance: Int
}

// Шаг 1. Карта действует (готово)
func validateCard(_ card: Card, currentYear: Int) throws {
    guard !card.isBlocked else {
        throw CheckoutError.cardBlocked
    }
    guard card.expiryYear >= currentYear else {
        throw CheckoutError.cardExpired(year: card.expiryYear)
    }
}

// Шаг 2. Дневной лимит не превышен (готово)
func checkDailyLimit(amount: Int, spentToday: Int) throws {
    let dailyLimit = 100000
    guard spentToday + amount <= dailyLimit else {
        throw CheckoutError.dailyLimitExceeded(left: dailyLimit - spentToday)
    }
}

// Шаг 3. Списание: вернуть баланс после списания или сообщить, сколько не хватает
func charge(_ amount: Int, from card: Card) throws -> Int {
    guard amount <= card.balance else {
        throw CheckoutError.insufficientFunds(missing: amount - card.balance)
    }
    return card.balance - amount
}

// Вся оплата: шаги 1, 2 и 3 по порядку. Ошибки здесь не ловим — пробрасываем
func checkout(amount: Int, card: Card, spentToday: Int, currentYear: Int) throws -> Int {
    try validateCard(card, currentYear: currentYear)
    try checkDailyLimit(amount: amount, spentToday: spentToday)
    return try charge(amount, from: card)
}

// Экран оплаты: здесь ошибки ловим и превращаем в текст
func checkoutMessage(amount: Int, card: Card, spentToday: Int, currentYear: Int) -> String {
    do {
        let rest = try checkout(amount: amount, card: card, spentToday: spentToday, currentYear: currentYear)
        return "Оплачено картой \(card.lastDigits). Остаток: \(rest) руб."
    } catch let error as CheckoutError {
        return error.userMessage
    } catch {
        return "Оплата не прошла"
    }
}

let card = Card(lastDigits: "4417", isBlocked: false, expiryYear: 2028, balance: 5000)
print(checkoutMessage(amount: 2500, card: card, spentToday: 0, currentYear: 2026))
print(checkoutMessage(amount: 7000, card: card, spentToday: 0, currentYear: 2026))
```

## @tests
```swift
func __t_charge(_ amount: Int, _ card: Card) -> String {
    do {
        let rest = try charge(amount, from: card)
        return "остаток \(rest)"
    } catch let error as CheckoutError {
        return "ошибка \(error)"
    } catch {
        return "посторонняя ошибка \(error)"
    }
}

func __t_checkout(_ amount: Int, _ card: Card, spent: Int = 0, year: Int = 2026) -> String {
    do {
        let rest = try checkout(amount: amount, card: card, spentToday: spent, currentYear: year)
        return "остаток \(rest)"
    } catch let error as CheckoutError {
        return "ошибка \(error)"
    } catch {
        return "посторонняя ошибка \(error)"
    }
}

let __t_main = Card(lastDigits: "4417", isBlocked: false, expiryYear: 2028, balance: 5000)
let __t_salary = Card(lastDigits: "0925", isBlocked: false, expiryYear: 2026, balance: 120000)
let __t_blocked = Card(lastDigits: "7781", isBlocked: true, expiryYear: 2029, balance: 100)
let __t_old = Card(lastDigits: "3302", isBlocked: false, expiryYear: 2025, balance: 9000)
let __t_empty = Card(lastDigits: "5150", isBlocked: false, expiryYear: 2030, balance: 0)

__eq("Шаг 3: списание 2500 руб. с 5000 руб.", __t_charge(2500, __t_main), "остаток 2500", hint: "charge возвращает card.balance - amount")
__eq("Шаг 3: списание всего баланса", __t_charge(5000, __t_main), "остаток 0", hint: "Если сумма равна балансу, денег хватает")
__eq("Шаг 3: не хватает 1 руб.", __t_charge(5001, __t_main), "ошибка insufficientFunds(missing: 1)", hint: "Если сумма больше баланса, брось insufficientFunds с разницей amount - card.balance")
__eq("Шаг 3: пустая карта", __t_charge(300, __t_empty), "ошибка insufficientFunds(missing: 300)")

__eq("Цепочка: всё в порядке", __t_checkout(2500, __t_main), "остаток 2500", hint: "checkout возвращает результат charge")
__eq("Цепочка: другая карта и сумма", __t_checkout(30000, __t_salary), "остаток 90000")
__eq("Цепочка: ошибка шага 1 (блокировка) выходит наружу", __t_checkout(50, __t_blocked), "ошибка cardBlocked", hint: "Вызови validateCard через try и не лови ошибку внутри checkout")
__eq("Цепочка: ошибка шага 1 (срок карты) выходит наружу", __t_checkout(100, __t_old), "ошибка cardExpired(year: 2025)")
__eq("Цепочка: карта действует до конца текущего года", __t_checkout(100, __t_salary, year: 2026), "остаток 119900")
__eq("Цепочка: ошибка шага 2 (лимит) выходит наружу", __t_checkout(2500, __t_main, spent: 99000), "ошибка dailyLimitExceeded(left: 1000)", hint: "Вызови checkDailyLimit через try, передав amount и spentToday")
__eq("Цепочка: ровно в дневной лимит можно", __t_checkout(2500, __t_main, spent: 97500), "остаток 2500", hint: "spentToday передавай в checkDailyLimit без изменений")
__eq("Цепочка: ошибка шага 3 выходит наружу", __t_checkout(7000, __t_main), "ошибка insufficientFunds(missing: 2000)")
__eq("Цепочка: блокировка проверяется раньше баланса", __t_checkout(900, __t_blocked), "ошибка cardBlocked", hint: "Шаги идут строго по порядку: карта, лимит, списание")
__eq("Цепочка: лимит проверяется раньше баланса", __t_checkout(8000, __t_main, spent: 95000), "ошибка dailyLimitExceeded(left: 5000)", hint: "Шаги идут строго по порядку: карта, лимит, списание")

__eq("Экран: успешная оплата", checkoutMessage(amount: 2500, card: __t_main, spentToday: 0, currentYear: 2026), "Оплачено картой 4417. Остаток: 2500 руб.", hint: "Номер — card.lastDigits, остаток — результат checkout")
__eq("Экран: другая карта", checkoutMessage(amount: 20000, card: __t_salary, spentToday: 0, currentYear: 2026), "Оплачено картой 0925. Остаток: 100000 руб.")
__eq("Экран: блокировка из шага 1", checkoutMessage(amount: 50, card: __t_blocked, spentToday: 0, currentYear: 2026), "Карта заблокирована", hint: "Для CheckoutError верни её userMessage: catch let error as CheckoutError")
__eq("Экран: срок карты из шага 1", checkoutMessage(amount: 100, card: __t_old, spentToday: 0, currentYear: 2026), "Срок действия карты закончился в 2025 году")
__eq("Экран: лимит из шага 2", checkoutMessage(amount: 2500, card: __t_main, spentToday: 99000, currentYear: 2026), "Превышен дневной лимит. Сегодня можно потратить ещё 1000 руб.")
__eq("Экран: нехватка из шага 3", checkoutMessage(amount: 7000, card: __t_main, spentToday: 0, currentYear: 2026), "Не хватает 2000 руб.")
```

## @rules
- must: /\btry\s+validateCard\s*\(/ :: В `checkout` вызови первый шаг через `try validateCard(...)`.
- must: /\btry\s+checkDailyLimit\s*\(/ :: В `checkout` вызови второй шаг через `try checkDailyLimit(...)`.
- must: /\btry\s+charge\s*\(/ :: В `checkout` вызови третий шаг через `try charge(...)`.
- must: /catch\s+let\s+\w+\s+as\s+CheckoutError\b/ :: На экране лови все ошибки оплаты одним блоком: `catch let error as CheckoutError`.

## @hint1
Иди снизу вверх по цепочке.

`charge` — обычная бросающая функция, как в прошлых задачах. Один `guard`: сумма не больше баланса карты. Иначе — `throw` с ошибкой о нехватке, в которой посчитано, сколько не хватает. После `guard` верни баланс карты минус сумма.

`checkout` — три строки, по одной на шаг. Каждый вызов начинается с `try`. Никаких `do` и `catch`: функция уже помечена `throws`, поэтому любая ошибка шага сама выйдет из неё наружу. Результат последнего шага сразу верни: `return` и `try` можно писать в одной строке.

`checkoutMessage` — это экран. Здесь нужен `do-catch`. В `do` вызови `checkout` и собери текст об успехе с номером карты и остатком. Потом `catch` с `let`, именем константы, словом `as` и типом `CheckoutError`. Внутри верни свойство `userMessage` пойманной ошибки. В конце общий `catch` для всего остального.

## @hint2
Цепочка и экран — на примере привязки карты:

```swift
func linkCard(number: String, country: String) throws -> String {
    try checkNumber(number)
    try checkCountry(country)
    return "Карта привязана"
}

do {
    let text = try linkCard(number: "1234", country: "RU")
    print(text)
} catch let error as LinkError {
    print("Не удалось привязать карту: \(error)")
} catch {
    print("Неизвестная ошибка")
}
```

У тебя последний шаг сам возвращает значение, поэтому его удобно записать как `return try charge(...)`.

## @hint3
Осталось заполнить пропуски:

```swift
func charge(_ amount: Int, from card: Card) throws -> Int {
    guard amount <= card.balance else {
        throw CheckoutError.insufficientFunds(missing: ___)
    }
    return card.balance - amount
}

func checkout(amount: Int, card: Card, spentToday: Int, currentYear: Int) throws -> Int {
    ___ validateCard(card, currentYear: currentYear)
    ___ checkDailyLimit(amount: amount, spentToday: spentToday)
    return ___ charge(amount, from: card)
}

func checkoutMessage(amount: Int, card: Card, spentToday: Int, currentYear: Int) -> String {
    do {
        let rest = try checkout(amount: amount, card: card, spentToday: spentToday, currentYear: currentYear)
        return "Оплачено картой \(card.lastDigits). Остаток: \(rest) руб."
    } catch let error ___ CheckoutError {
        return error.___
    } catch {
        return "Оплата не прошла"
    }
}
```

В первом пропуске — сколько не хватает. В трёх следующих — одно и то же слово. Дальше — слово для приведения типа и свойство с текстом для покупателя.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `checkout` — это просто три шага подряд с `try`. Если все шаги прошли, она возвращает результат `charge`. Если любой шаг бросил ошибку, `checkout` останавливается на этой строке и выпускает ту же ошибку наружу. Например, при заблокированной карте ни лимит, ни списание даже не начнутся. Ошибка из `validateCard` выходит из `checkout` и оказывается в `catch` на экране — через два уровня вызовов.

**Почему ловим только на экране.** Шаги и цепочка не знают, как сообщить о проблеме человеку. Это может быть текст на экране, пуш-уведомление или запись в журнал. Решать это должен тот, кто показывает результат. Если бы `checkout` ловила ошибки сама, ей пришлось бы вернуть какое-то число вместо баланса — и мы снова оказались бы в мире «минус единицы» из первой задачи.

**Почему `catch let error as CheckoutError`.** Экрану всё равно, какой именно случай пойман: у каждого уже есть `userMessage`. Один блок заменяет четыре. Внутри него `error` имеет тип `CheckoutError`, поэтому свойство доступно. Общий `catch` всё равно нужен: `checkout` объявлена просто с `throws`, и Swift не знает, что других ошибок не бывает.

**Типичные ошибки:**

- в `checkout` написан `do-catch` — ошибка «проглатывается», и экран не узнаёт, что случилось;
- `return charge(amount, from: card)` без `try` — компилятор потребует `try` и в этом месте;
- в `charge` разница посчитана наоборот: `card.balance - amount` даст отрицательное число;
- в тексте успеха написан `card.balance` вместо остатка после списания.
