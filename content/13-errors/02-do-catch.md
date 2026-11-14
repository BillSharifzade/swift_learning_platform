---
title: Сообщение для покупателя
concept: do, try, catch — ловим ошибки и выбираем текст
---

## @description

### Контекст
Функция `pay` теперь честно бросает ошибки. Пора воспользоваться этим на экране оплаты. Дизайнер прислала макет: под кнопкой «Оплатить» появляется одна строка — либо об успехе, либо о том, что именно не так.

В макете есть тексты для трёх самых частых ошибок. Для превышения дневного лимита текст ещё согласуют с юристами. Пока для него и для любых других проблем показываем общую фразу.

Тимлид добавила к задаче: «Функцию `pay` не трогай, она уже проверена. Твоя часть — поймать её ошибки и превратить их в слова».

### Новое в Swift
В прошлой задаче ты бросала ошибки. Теперь научимся их **ловить**. Для этого есть конструкция `do-catch`:

```swift
do {
    try checkNewPin(pin)
    print("ПИН-код сохранён")
} catch {
    print("Не получилось: \(error)")
}
```

Как она работает:

- Код в блоке `do` выполняется по порядку, как обычно.
- Перед каждым вызовом, который может бросить ошибку, стоит `try`.
- Если функция бросила ошибку, остаток блока `do` **пропускается**, и выполнение сразу прыгает в `catch`. В примере выше строка «ПИН-код сохранён» не напечатается.
- Если ошибок не было, `catch` не выполняется вовсе.

Внутри `catch` без условий есть готовая константа `error` — это та самая брошенная ошибка. Объявлять её не нужно.

**Разные ошибки — разные реакции.** После `catch` можно написать конкретный случай ошибки. Такой блок сработает только для него:

```swift
func pinMessage(for pin: String) -> String {
    do {
        try checkNewPin(pin)
        return "ПИН-код сохранён"
    } catch PinError.wrongLength {
        return "ПИН-код состоит из 4 цифр"
    } catch PinError.tooSimple {
        return "Слишком простой ПИН-код"
    } catch {
        return "Не удалось сохранить ПИН-код"
    }
}
```

Блоки `catch` проверяются сверху вниз, срабатывает первый подходящий. Последний `catch` без условия ловит всё остальное.

**Зачем общий `catch`, если все случаи уже перечислены?** Слово `throws` говорит «могу бросить ошибку», но не говорит, какого типа. Для Swift это может быть любая ошибка, поэтому без общего `catch` код не соберётся. Компилятор скажет: `errors thrown from here are not handled because the enclosing catch is not exhaustive` — «перечислены не все случаи».

> ⚠️ Константа, объявленная внутри `do`, видна только внутри `do`. Если результат нужен дальше, используй его прямо там — например, сразу собери из него строку.

> 💡 Функция с `do-catch` внутри сама уже ничего не бросает. Её можно вызывать без `try` — все ошибки она обработала.

### Задача
В редакторе уже есть перечисление `PaymentError` и готовая функция `pay(amount:balance:isCardBlocked:)`. Не меняй их.

Допиши функцию `paymentMessage(amount:balance:isCardBlocked:)` — у неё такие же параметры, как у `pay`, а возвращает она `String`:

1. Внутри блока `do` вызови `pay` с теми же значениями. Если платёж прошёл, верни `Оплачено. Остаток: 1550 руб.` — вместо `1550` подставь баланс, который вернула `pay`.
2. Для ошибки `PaymentError.invalidAmount` верни `Введите сумму больше нуля`.
3. Для `PaymentError.cardBlocked` — `Карта заблокирована. Обратитесь в банк`.
4. Для `PaymentError.insufficientFunds` — `Недостаточно средств на карте`.
5. Для любой другой ошибки — `Платёж не прошёл. Попробуйте позже`.

Каждую из трёх ошибок лови отдельным `catch` с её случаем.

### Пример
```swift
paymentMessage(amount: 450, balance: 2000, isCardBlocked: false)
// "Оплачено. Остаток: 1550 руб."

paymentMessage(amount: 450, balance: 2000, isCardBlocked: true)
// "Карта заблокирована. Обратитесь в банк"

paymentMessage(amount: 60000, balance: 100000, isCardBlocked: false)
// "Платёж не прошёл. Попробуйте позже" — сработал дневной лимит
```

## @starter
```swift
// Причины отказа в платеже
enum PaymentError: Error {
    case invalidAmount
    case cardBlocked
    case dailyLimitExceeded
    case insufficientFunds
}

// Проводит платёж и возвращает новый баланс (код готов, его не меняй)
func pay(amount: Int, balance: Int, isCardBlocked: Bool) throws -> Int {
    guard amount > 0 else {
        throw PaymentError.invalidAmount
    }
    guard !isCardBlocked else {
        throw PaymentError.cardBlocked
    }
    guard amount <= 50000 else {
        throw PaymentError.dailyLimitExceeded
    }
    guard amount <= balance else {
        throw PaymentError.insufficientFunds
    }
    return balance - amount
}

// Текст под кнопкой Оплатить
func paymentMessage(amount: Int, balance: Int, isCardBlocked: Bool) -> String {
    // Вызови pay в блоке do и верни текст об успехе.
    // Для каждой ошибки из макета напиши свой catch, для остальных — общий

    return ""
}

// Так экран показывает результат
print(paymentMessage(amount: 450, balance: 2000, isCardBlocked: false))
print(paymentMessage(amount: 450, balance: 2000, isCardBlocked: true))
```

## @solution
```swift
// Причины отказа в платеже
enum PaymentError: Error {
    case invalidAmount
    case cardBlocked
    case dailyLimitExceeded
    case insufficientFunds
}

// Проводит платёж и возвращает новый баланс (код готов, его не меняй)
func pay(amount: Int, balance: Int, isCardBlocked: Bool) throws -> Int {
    guard amount > 0 else {
        throw PaymentError.invalidAmount
    }
    guard !isCardBlocked else {
        throw PaymentError.cardBlocked
    }
    guard amount <= 50000 else {
        throw PaymentError.dailyLimitExceeded
    }
    guard amount <= balance else {
        throw PaymentError.insufficientFunds
    }
    return balance - amount
}

// Текст под кнопкой Оплатить
func paymentMessage(amount: Int, balance: Int, isCardBlocked: Bool) -> String {
    // Вызови pay в блоке do и верни текст об успехе.
    // Для каждой ошибки из макета напиши свой catch, для остальных — общий
    do {
        let rest = try pay(amount: amount, balance: balance, isCardBlocked: isCardBlocked)
        return "Оплачено. Остаток: \(rest) руб."
    } catch PaymentError.invalidAmount {
        return "Введите сумму больше нуля"
    } catch PaymentError.cardBlocked {
        return "Карта заблокирована. Обратитесь в банк"
    } catch PaymentError.insufficientFunds {
        return "Недостаточно средств на карте"
    } catch {
        return "Платёж не прошёл. Попробуйте позже"
    }
}

// Так экран показывает результат
print(paymentMessage(amount: 450, balance: 2000, isCardBlocked: false))
print(paymentMessage(amount: 450, balance: 2000, isCardBlocked: true))
```

## @tests
```swift
__eq("Платёж 450 руб. при балансе 2000 руб.", paymentMessage(amount: 450, balance: 2000, isCardBlocked: false), "Оплачено. Остаток: 1550 руб.", hint: "При успехе верни: Оплачено. Остаток: и баланс, который вернула pay, а потом руб.")
__eq("Платёж 1990 руб. при балансе 5000 руб.", paymentMessage(amount: 1990, balance: 5000, isCardBlocked: false), "Оплачено. Остаток: 3010 руб.", hint: "Остаток нужно брать из результата pay, а не писать готовым числом")
__eq("Оплата всем балансом: остаток 0 руб.", paymentMessage(amount: 2000, balance: 2000, isCardBlocked: false), "Оплачено. Остаток: 0 руб.")
__eq("Сумма 0 руб.", paymentMessage(amount: 0, balance: 2000, isCardBlocked: false), "Введите сумму больше нуля", hint: "Для PaymentError.invalidAmount нужен свой catch")
__eq("Отрицательная сумма", paymentMessage(amount: -100, balance: 2000, isCardBlocked: false), "Введите сумму больше нуля")
__eq("Карта заблокирована", paymentMessage(amount: 450, balance: 2000, isCardBlocked: true), "Карта заблокирована. Обратитесь в банк", hint: "Для PaymentError.cardBlocked нужен свой catch")
__eq("Не хватает 1 руб.", paymentMessage(amount: 2001, balance: 2000, isCardBlocked: false), "Недостаточно средств на карте", hint: "Для PaymentError.insufficientFunds нужен свой catch")
__eq("Пустая карта", paymentMessage(amount: 300, balance: 0, isCardBlocked: false), "Недостаточно средств на карте")
__eq("Превышен дневной лимит: общий текст", paymentMessage(amount: 60000, balance: 100000, isCardBlocked: false), "Платёж не прошёл. Попробуйте позже", hint: "Для ошибок без своего текста (например, dailyLimitExceeded) срабатывает общий catch без условия")
__eq("Ровно 50000 руб. — это ещё не превышение лимита", paymentMessage(amount: 50000, balance: 80000, isCardBlocked: false), "Оплачено. Остаток: 30000 руб.")
```

## @rules
- must: /\bdo\s*\{/ :: Вызывай `pay` внутри блока `do { ... }` — в коде его не видно.
- must: /\btry\s+pay\s*\(/ :: Текст должен зависеть от того, что ответила `pay`: вызови её через `try pay(...)`.
- must: /catch\s+PaymentError\.cardBlocked/ :: Лови ошибки отдельными блоками, например `catch PaymentError.cardBlocked { ... }`.
- must: /catch\s*\{/ :: В конце нужен общий `catch { ... }` без условия — для всех остальных ошибок.

## @hint1
Вся работа — внутри `paymentMessage`. Заглушку `return ""` можно убрать.

Сначала блок `do`. В нём объяви константу, в которую положишь результат вызова `pay`. Перед вызовом обязательно стоит `try`, а значения для параметров бери из параметров `paymentMessage` — у них те же имена. Следующей строкой, ещё внутри `do`, верни текст об успехе, вставив туда эту константу через интерполяцию.

Сразу после закрывающей скобки `do` идут блоки `catch`. Первые три — с конкретными ошибками: после слова `catch` пишется имя перечисления, точка и случай. Внутри каждого — `return` с нужным текстом из задания.

Последний `catch` — без условия. Он вернёт общую фразу для всех остальных ошибок.

## @hint2
Вызов внутри `do` и один из `catch`:

```swift
do {
    let rest = try pay(amount: amount, balance: balance, isCardBlocked: isCardBlocked)
    return "Оплачено. Остаток: \(rest) руб."
} catch PaymentError.invalidAmount {
    return "Введите сумму больше нуля"
}
```

Дальше допиши ещё два `catch` с конкретными ошибками и один общий в самом конце.

## @hint3
Остались пропуски:

```swift
func paymentMessage(amount: Int, balance: Int, isCardBlocked: Bool) -> String {
    do {
        let rest = ___ pay(amount: amount, balance: balance, isCardBlocked: isCardBlocked)
        return "Оплачено. Остаток: \(rest) руб."
    } catch PaymentError.invalidAmount {
        return "Введите сумму больше нуля"
    } catch PaymentError.___ {
        return "Карта заблокирована. Обратитесь в банк"
    } catch PaymentError.insufficientFunds {
        return "Недостаточно средств на карте"
    } ___ {
        return "Платёж не прошёл. Попробуйте позже"
    }
}
```

В первом пропуске — слово, которое ставят перед вызовом бросающей функции. Во втором — случай для заблокированной карты. В третьем — общий блок для всех остальных ошибок.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** В блоке `do` вызывается `pay`. Если она вернула баланс, следующая строка собирает текст об успехе, и функция заканчивается на этом `return`. Если `pay` бросила ошибку, строка с успехом пропускается: выполнение прыгает к блокам `catch`. Swift проверяет их сверху вниз и выбирает первый подходящий. Для `dailyLimitExceeded` своего блока нет, поэтому срабатывает последний, общий.

**Почему константа `rest` внутри `do`.** Она нужна только для текста об успехе, а этот текст собирается там же. Снаружи `do` константы `rest` не существует — и это правильно: если платёж не прошёл, никакого остатка нет.

**Почему общий `catch` обязателен.** `pay` объявлена просто с `throws`, без уточнения, какие ошибки она бросает. Swift не заглядывает внутрь и не знает, что там только `PaymentError`. Поэтому он требует, чтобы любая возможная ошибка была обработана. Общий `catch` закрывает этот вопрос — и заодно защищает экран, если в `pay` однажды появится новая причина отказа.

**Типичные ошибки:**

- `pay(...)` без `try` — компилятор напомнит, что вызов может бросить ошибку;
- нет последнего `catch` без условия — код не соберётся, потому что обработаны не все ошибки;
- общий `catch` поставлен первым — тогда он перехватит всё, и до конкретных блоков дело не дойдёт;
- в тексте успеха написан баланс из параметра, а не остаток из `pay`.
