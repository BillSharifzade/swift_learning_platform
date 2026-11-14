---
title: Сколько не хватает
concept: Ошибки со связанными значениями и их разбор в catch
---

## @description

### Контекст
В «Монете» появились переводы по номеру телефона. Билол пробует перевести 3250 руб., а на карте 3000. Приложение отвечает «Недостаточно средств», и он не понимает, на сколько пополнить карту.

Продакт-менеджер пишет в тикете: «Сообщения об отказе должны быть конкретными. Не хватает денег — скажи, сколько именно. Превышен лимит — назови лимит. Человек не должен ничего считать сам».

Получается, ошибке мало просто назвать причину. Ей нужно ещё и нести с собой подробности: число, которое потом окажется в тексте на экране.

### Новое в Swift
Ты уже знаешь **связанные значения** из «Ветра»: случай перечисления может хранить данные, например `case onTheWay(minutes: Int)`. С ошибками это работает точно так же — ведь ошибка тоже перечисление.

Возьмём снятие наличных в банкомате:

```swift
enum CashError: Error {
    case wrongBanknotes(nearest: Int)
    case atmLimit(max: Int)
}
```

**Бросить** такую ошибку можно только вместе со значением:

```swift
func checkCashAmount(_ amount: Int) throws {
    guard amount <= 30000 else {
        throw CashError.atmLimit(max: 30000)
    }
    guard amount % 100 == 0 else {
        throw CashError.wrongBanknotes(nearest: amount / 100 * 100)
    }
}
```

Значение считается в момент броска. Для суммы `1250` ошибка унесёт с собой `nearest: 1200` — ближайшую сумму, которую банкомат может выдать.

**Достать значение** можно прямо в `catch`. В скобках после случая пишут `let` и имя константы — так же, как в `switch` по перечислению:

```swift
do {
    try checkCashAmount(1250)
    print("Заберите наличные")
} catch CashError.wrongBanknotes(let nearest) {
    print("Банкомат выдаёт суммы, кратные 100. Например, \(nearest) руб.")
} catch CashError.atmLimit(let max) {
    print("За один раз можно снять не больше \(max) руб.")
} catch {
    print("Операция недоступна")
}
```

Напечатается: `Банкомат выдаёт суммы, кратные 100. Например, 1200 руб.`

Константа `nearest` существует только внутри своего блока `catch`. Имя для неё ты выбираешь сама, оно не обязано совпадать с меткой в объявлении. Но совпадающее имя читать проще.

> 💡 Если значение в каком-то блоке не нужно, скобки можно не писать: `catch CashError.atmLimit { ... }` поймает этот случай с любым лимитом.

> ⚠️ Метки при броске обязательны: `throw CashError.atmLimit(max: 30000)`. Без метки, `atmLimit(30000)`, код не соберётся — Swift попросит вписать `max:`.

### Задача
1. Допиши в перечисление `TransferError` два случая со связанными значениями:
   - `limitExceeded(limit: Int)` — сумма больше лимита на один перевод;
   - `insufficientFunds(missing: Int)` — на карте не хватает денег, `missing` — сколько именно.
2. Допиши функцию `transfer(amount:balance:limit:)`. Все три параметра — `Int`. Функция помечена `throws` и возвращает `Int` — остаток на карте после перевода. Проверки по порядку:
   1. `amount` меньше или равна нулю — бросить `TransferError.invalidAmount`;
   2. `amount` больше `limit` — бросить `limitExceeded`, передав в `limit` значение параметра `limit`;
   3. `amount` больше `balance` — бросить `insufficientFunds`, где `missing` равно `amount - balance`;
   4. иначе вернуть `balance - amount`.
3. Допиши функцию `transferMessage(amount:balance:limit:)` с теми же параметрами. Она вызывает `transfer` и возвращает `String`:
   - успех — `Перевод выполнен. Остаток: 4500 руб.` (остаток — из результата `transfer`);
   - `invalidAmount` — `Введите сумму больше нуля`;
   - `limitExceeded` — `За один раз можно перевести не больше 15000 руб.` (число — из ошибки);
   - `insufficientFunds` — `Не хватает 250 руб.` (число — из ошибки);
   - любая другая ошибка — `Перевод не выполнен`.

### Пример
```swift
try transfer(amount: 3250, balance: 3000, limit: 15000)
// ошибка TransferError.insufficientFunds(missing: 250)

transferMessage(amount: 3250, balance: 3000, limit: 15000)
// "Не хватает 250 руб."

transferMessage(amount: 20000, balance: 50000, limit: 15000)
// "За один раз можно перевести не больше 15000 руб."

transferMessage(amount: 500, balance: 5000, limit: 15000)
// "Перевод выполнен. Остаток: 4500 руб."
```

## @starter
```swift
// Причины, по которым перевод не выполняется
enum TransferError: Error {
    case invalidAmount
    // Допиши два случая со связанными значениями:
    // limitExceeded с лимитом и insufficientFunds с суммой, которой не хватает

}

// Переводит деньги и возвращает остаток на карте
func transfer(amount: Int, balance: Int, limit: Int) throws -> Int {
    // 1. Сумма больше нуля

    // 2. Сумма не больше лимита на один перевод

    // 3. Денег хватает (иначе сообщи, сколько не хватает)

    // 4. Всё в порядке
    return balance - amount
}

// Текст для экрана перевода
func transferMessage(amount: Int, balance: Int, limit: Int) -> String {
    // Вызови transfer и верни текст: об успехе или о причине отказа с подробностями

    return ""
}

print(transferMessage(amount: 3250, balance: 3000, limit: 15000))
```

## @solution
```swift
// Причины, по которым перевод не выполняется
enum TransferError: Error {
    case invalidAmount
    // Допиши два случая со связанными значениями:
    // limitExceeded с лимитом и insufficientFunds с суммой, которой не хватает
    case limitExceeded(limit: Int)
    case insufficientFunds(missing: Int)
}

// Переводит деньги и возвращает остаток на карте
func transfer(amount: Int, balance: Int, limit: Int) throws -> Int {
    // 1. Сумма больше нуля
    guard amount > 0 else {
        throw TransferError.invalidAmount
    }
    // 2. Сумма не больше лимита на один перевод
    guard amount <= limit else {
        throw TransferError.limitExceeded(limit: limit)
    }
    // 3. Денег хватает (иначе сообщи, сколько не хватает)
    guard amount <= balance else {
        throw TransferError.insufficientFunds(missing: amount - balance)
    }
    // 4. Всё в порядке
    return balance - amount
}

// Текст для экрана перевода
func transferMessage(amount: Int, balance: Int, limit: Int) -> String {
    // Вызови transfer и верни текст: об успехе или о причине отказа с подробностями
    do {
        let rest = try transfer(amount: amount, balance: balance, limit: limit)
        return "Перевод выполнен. Остаток: \(rest) руб."
    } catch TransferError.invalidAmount {
        return "Введите сумму больше нуля"
    } catch TransferError.limitExceeded(let limit) {
        return "За один раз можно перевести не больше \(limit) руб."
    } catch TransferError.insufficientFunds(let missing) {
        return "Не хватает \(missing) руб."
    } catch {
        return "Перевод не выполнен"
    }
}

print(transferMessage(amount: 3250, balance: 3000, limit: 15000))
```

## @tests
```swift
func __t_outcome(_ amount: Int, _ balance: Int, _ limit: Int) -> String {
    do {
        let rest = try transfer(amount: amount, balance: balance, limit: limit)
        return "остаток \(rest)"
    } catch TransferError.invalidAmount {
        return "ошибка invalidAmount"
    } catch TransferError.limitExceeded(let limit) {
        return "ошибка limitExceeded, limit = \(limit)"
    } catch TransferError.insufficientFunds(let missing) {
        return "ошибка insufficientFunds, missing = \(missing)"
    } catch {
        return "другая ошибка: \(error)"
    }
}

__eq("transfer: 500 руб. при балансе 5000 руб.", __t_outcome(500, 5000, 15000), "остаток 4500", hint: "Если всё в порядке, transfer возвращает balance - amount")
__eq("transfer: перевод всего баланса", __t_outcome(3000, 3000, 15000), "остаток 0", hint: "Если сумма ровно равна балансу, денег хватает")
__eq("transfer: ровно в лимит можно", __t_outcome(15000, 20000, 15000), "остаток 5000", hint: "Сумма, равная лимиту, разрешена. Ошибка нужна, только когда amount больше limit")
__eq("transfer: сумма 0", __t_outcome(0, 3000, 15000), "ошибка invalidAmount", hint: "Ноль — неправильная сумма")
__eq("transfer: не хватает 250 руб.", __t_outcome(3250, 3000, 15000), "ошибка insufficientFunds, missing = 250", hint: "В missing положи amount - balance: сколько не хватает")
__eq("transfer: не хватает 1 руб.", __t_outcome(3001, 3000, 15000), "ошибка insufficientFunds, missing = 1")
__eq("transfer: пустая карта, перевод 700 руб.", __t_outcome(700, 0, 15000), "ошибка insufficientFunds, missing = 700")
__eq("transfer: лимит 15000 руб. превышен", __t_outcome(20000, 50000, 15000), "ошибка limitExceeded, limit = 15000", hint: "В limitExceeded передай значение параметра limit")
__eq("transfer: другой лимит — 5000 руб.", __t_outcome(5001, 9000, 5000), "ошибка limitExceeded, limit = 5000", hint: "Лимит нужно брать из параметра, а не писать готовым числом")
__eq("transfer: лимит проверяется раньше баланса", __t_outcome(20000, 1000, 15000), "ошибка limitExceeded, limit = 15000", hint: "Порядок проверок: сумма, лимит, баланс")

__eq("Сообщение: успех", transferMessage(amount: 500, balance: 5000, limit: 15000), "Перевод выполнен. Остаток: 4500 руб.", hint: "Остаток бери из результата transfer")
__eq("Сообщение: другой успешный перевод", transferMessage(amount: 1200, balance: 2000, limit: 15000), "Перевод выполнен. Остаток: 800 руб.")
__eq("Сообщение: сумма 0", transferMessage(amount: 0, balance: 5000, limit: 15000), "Введите сумму больше нуля")
__eq("Сообщение: не хватает 250 руб.", transferMessage(amount: 3250, balance: 3000, limit: 15000), "Не хватает 250 руб.", hint: "Достань сумму из ошибки: catch TransferError.insufficientFunds(let missing)")
__eq("Сообщение: не хватает 4700 руб.", transferMessage(amount: 5000, balance: 300, limit: 15000), "Не хватает 4700 руб.", hint: "Число в тексте должно приходить из ошибки, а не быть написано заранее")
__eq("Сообщение: лимит 15000 руб.", transferMessage(amount: 20000, balance: 50000, limit: 15000), "За один раз можно перевести не больше 15000 руб.", hint: "Достань лимит из ошибки: catch TransferError.limitExceeded(let limit)")
__eq("Сообщение: лимит 5000 руб.", transferMessage(amount: 7000, balance: 50000, limit: 5000), "За один раз можно перевести не больше 5000 руб.")
```

## @rules
- must: /catch\s+TransferError\.insufficientFunds\s*\(/ :: Сумму, которой не хватает, достань прямо в `catch`: `catch TransferError.insufficientFunds(let missing)`.
- must: /\btry\s+transfer\s*\(/ :: Текст должен зависеть от ответа `transfer`: вызови её через `try transfer(...)`.

## @hint1
Начни с перечисления. Новые случаи объявляются так же, как в «Ветре»: имя случая, а в скобках — метка, двоеточие и тип `Int`.

Функция `transfer` устроена как `pay` из первой задачи: три `guard` подряд, в каждом `else` — `throw`. Разница в том, что две ошибки теперь несут значение. Для лимита это просто параметр `limit`. Для нехватки денег значение нужно посчитать: насколько сумма перевода больше баланса.

Функция `transferMessage` устроена как `paymentMessage` из второй задачи: `do` с вызовом и текстом об успехе, затем блоки `catch`. Новое только в двух из них: после имени случая в скобках стоит `let` и имя константы. Эту константу вставляешь в текст через интерполяцию. Не забудь общий `catch` в конце.

## @hint2
Бросок и разбор ошибки со значением — на примере банкомата:

```swift
throw CashError.atmLimit(max: 30000)

// ...

} catch CashError.atmLimit(let max) {
    return "За один раз можно снять не больше \(max) руб."
}
```

В `transfer` значение для `insufficientFunds` считается прямо при броске: `missing: amount - balance`.

## @hint3
Осталось заполнить пропуски:

```swift
enum TransferError: Error {
    case invalidAmount
    case limitExceeded(limit: Int)
    case insufficientFunds(missing: Int)
}

func transfer(amount: Int, balance: Int, limit: Int) throws -> Int {
    guard amount > 0 else {
        throw TransferError.invalidAmount
    }
    guard amount <= limit else {
        throw TransferError.limitExceeded(limit: ___)
    }
    guard amount <= balance else {
        throw TransferError.insufficientFunds(missing: ___)
    }
    return balance - amount
}

func transferMessage(amount: Int, balance: Int, limit: Int) -> String {
    do {
        let rest = try transfer(amount: amount, balance: balance, limit: limit)
        return "Перевод выполнен. Остаток: \(rest) руб."
    } catch TransferError.invalidAmount {
        return "Введите сумму больше нуля"
    } catch TransferError.limitExceeded(let limit) {
        return "За один раз можно перевести не больше \(limit) руб."
    } catch TransferError.insufficientFunds(___) {
        return "Не хватает \(missing) руб."
    } catch {
        return "Перевод не выполнен"
    }
}
```

В первом пропуске — параметр с лимитом. Во втором — разница, которой не хватает. В третьем — объявление константы `missing` прямо в образце.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** В момент броска ошибка «запоминает» значение. `TransferError.insufficientFunds(missing: amount - balance)` для перевода 3250 при балансе 3000 превращается в ошибку с числом `250` внутри. Дальше это число путешествует вместе с ошибкой. В `transferMessage` блок `catch TransferError.insufficientFunds(let missing)` делает две вещи сразу: проверяет, что пойман именно этот случай, и кладёт число в константу `missing`. Остаётся вставить его в текст.

**Почему считать в `transfer`, а не на экране.** Только `transfer` знает, как устроено правило: она сравнивала сумму с балансом и сразу видит разницу. Экрану незачем повторять расчёт. Если правило поменяется — например, появится комиссия, — исправить нужно будет одно место. Тексты при этом останутся верными.

**Почему лимит тоже в ошибке.** Лимит у разных клиентов разный. Экран не обязан его знать: ошибка приносит правильное число с собой.

**Типичные ошибки:**

- `missing: balance - amount` — получится отрицательное число, например `-250`;
- `throw TransferError.limitExceeded(limit: 15000)` — для клиента с другим лимитом текст окажется неверным;
- `catch TransferError.insufficientFunds` без `(let missing)` — тогда константы `missing` нет, и в тексте её не вставить;
- проверка баланса стоит раньше лимита — при большой сумме человек увидит не ту причину.
