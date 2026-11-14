---
title: Отклонённый платёж
concept: Тип ошибки Error, throw и throws
---

## @description

### Контекст
«Монета» — платёжный сервис: через него интернет-магазины принимают оплату картой. Сердце сервиса — функция `pay`. Она списывает сумму с карты и возвращает новый баланс.

Сейчас, если платёж провести нельзя, функция просто возвращает `-1`. Экран оплаты видит минус единицу и пишет покупателю «Что-то пошло не так». Служба поддержки жалуется: Билол третий раз звонит и спрашивает, почему не проходит оплата, а ответить ему нечего — причина потерялась внутри функции.

Тимлид ставит задачу: «Пусть `pay` не прячет проблему за странным числом, а честно сообщает причину отказа. В Swift для этого есть ошибки».

### Новое в Swift
**Ошибка** в Swift — это обычное значение, которое описывает, что пошло не так. Чтобы значение могло быть ошибкой, его тип подписывают на протокол `Error`. Чаще всего для этого берут перечисление: каждый случай — одна причина.

```swift
enum PinError: Error {
    case wrongLength
    case tooSimple
}
```

`Error` — такой же протокол, как те, что ты писала в «Почтальоне». Только требований у него нет: подписать тип на `Error` — значит просто сказать Swift «значения этого типа описывают ошибки».

**Бросить ошибку** — значит остановить функцию и вместо результата отдать наружу ошибку. Для этого есть слово `throw`:

```swift
throw PinError.tooSimple
```

`throw` похож на `return`: функция сразу заканчивается, строки ниже не выполняются. Разница в том, что наружу уходит не результат, а ошибка.

**Функцию, которая может бросить ошибку**, помечают словом `throws`. Оно стоит сразу после скобок с параметрами:

```swift
func checkNewPin(_ pin: String) throws {
    guard pin.count == 4 else {
        throw PinError.wrongLength
    }
    if pin == "1234" || pin == "0000" {
        throw PinError.tooSimple
    }
}
```

Если функция ещё и возвращает значение, `throws` стоит **перед стрелкой**:

```swift
func dailyLimit(forLevel level: Int) throws -> Int
```

Такая функция либо возвращает число, либо бросает ошибку. Третьего не дано.

**Как её вызывают.** Перед вызовом пишут слово `try` — «попробуй»: `try checkNewPin("4821")`. Так в коде видно каждое место, где что-то может пойти не так. Как поймать ошибку и показать человеку сообщение — в следующей задаче. Сегодня твою функцию будет вызывать проверка: она сама поймает ошибку и посмотрит, та ли это ошибка.

> ⚠️ Бросить можно только значение, тип которого подписан на `Error`. `throw "Карта заблокирована"` не соберётся: строка — не ошибка. И `throw` работает только внутри функции, помеченной `throws`. Если забыть это слово, компилятор напишет `error is not handled because the enclosing function is not declared 'throws'` — «ошибку некому обработать: функция не помечена throws».

> 💡 Почему не `nil` и не `-1`? Они говорят только «не получилось». Ошибка говорит, **почему** не получилось. А ещё Swift не даст вызвать функцию с `throws` без `try` — забыть про возможную проблему просто не получится.

### Задача
1. Объяви перечисление `PaymentError`, подписанное на протокол `Error`, с тремя случаями:
   - `invalidAmount` — сумма платежа не больше нуля;
   - `cardBlocked` — карта заблокирована;
   - `insufficientFunds` — на карте не хватает денег.
2. Допиши функцию `pay(amount:balance:isCardBlocked:)`. Параметры `amount` и `balance` имеют тип `Int`, `isCardBlocked` — тип `Bool`. Функция помечена `throws` и возвращает `Int` — баланс после списания.
3. Проверки идут строго в таком порядке:
   1. `amount` меньше или равна нулю — бросить `PaymentError.invalidAmount`;
   2. карта заблокирована — бросить `PaymentError.cardBlocked`;
   3. `amount` больше `balance` — бросить `PaymentError.insufficientFunds`;
   4. иначе вернуть `balance - amount`. Списать весь баланс до нуля можно.

### Пример
```swift
try pay(amount: 300, balance: 1000, isCardBlocked: false)   // 700
try pay(amount: 1000, balance: 1000, isCardBlocked: false)  // 0
try pay(amount: 0, balance: 1000, isCardBlocked: false)     // ошибка PaymentError.invalidAmount
try pay(amount: 300, balance: 1000, isCardBlocked: true)    // ошибка PaymentError.cardBlocked
try pay(amount: 1500, balance: 1000, isCardBlocked: false)  // ошибка PaymentError.insufficientFunds
```

## @starter
```swift
// Причины, по которым платёж может не пройти.
// Подпиши перечисление на протокол Error и допиши два недостающих случая
enum PaymentError {
    case invalidAmount
}

// Списывает сумму с карты и возвращает новый баланс.
// Если платёж провести нельзя, функция бросает ошибку PaymentError,
// поэтому её нужно пометить словом throws
func pay(amount: Int, balance: Int, isCardBlocked: Bool) -> Int {
    // 1. Сумма должна быть больше нуля

    // 2. Карта не должна быть заблокирована

    // 3. Денег на карте должно хватать

    // 4. Всё в порядке: списываем сумму
    return balance - amount
}
```

## @solution
```swift
// Причины, по которым платёж может не пройти.
// Подпиши перечисление на протокол Error и допиши два недостающих случая
enum PaymentError: Error {
    case invalidAmount
    case cardBlocked
    case insufficientFunds
}

// Списывает сумму с карты и возвращает новый баланс.
// Если платёж провести нельзя, функция бросает ошибку PaymentError,
// поэтому её нужно пометить словом throws
func pay(amount: Int, balance: Int, isCardBlocked: Bool) throws -> Int {
    // 1. Сумма должна быть больше нуля
    guard amount > 0 else {
        throw PaymentError.invalidAmount
    }
    // 2. Карта не должна быть заблокирована
    guard !isCardBlocked else {
        throw PaymentError.cardBlocked
    }
    // 3. Денег на карте должно хватать
    guard amount <= balance else {
        throw PaymentError.insufficientFunds
    }
    // 4. Всё в порядке: списываем сумму
    return balance - amount
}
```

## @tests
```swift
func __t_balance(_ name: String, _ amount: Int, _ balance: Int, _ blocked: Bool, _ want: Int, hint: String = "") {
    do {
        let rest = try pay(amount: amount, balance: balance, isCardBlocked: blocked)
        __eq(name, rest, want, hint: hint)
    } catch {
        __fail(name, "Функция бросила ошибку \(error), а платёж должен пройти. " + hint)
    }
}

func __t_error(_ name: String, _ amount: Int, _ balance: Int, _ blocked: Bool, _ want: PaymentError, hint: String = "") {
    do {
        let rest = try pay(amount: amount, balance: balance, isCardBlocked: blocked)
        __fail(name, "Функция вернула баланс \(rest), а должна была бросить PaymentError.\(want). " + hint)
    } catch let error as PaymentError {
        if error == want {
            __pass(name)
        } else {
            __fail(name, "Брошена ошибка PaymentError.\(error), а нужна PaymentError.\(want). " + hint)
        }
    } catch {
        __fail(name, "Брошена посторонняя ошибка \(error), а нужна PaymentError.\(want)")
    }
}

__t_balance("Платёж 300 руб. при балансе 1000 руб.", 300, 1000, false, 700, hint: "Если всё в порядке, верни balance - amount")
__t_balance("Платёж 1250 руб. при балансе 5000 руб.", 1250, 5000, false, 3750, hint: "Баланс нужно считать из параметров, а не писать готовым числом")
__t_balance("Списать весь баланс до нуля можно", 1000, 1000, false, 0, hint: "Если сумма ровно равна балансу, денег хватает. Ошибка нужна, только когда amount больше balance")
__t_balance("Платёж в 1 руб. проходит", 1, 50, false, 49, hint: "Сумма 1 больше нуля — это нормальный платёж")

__t_error("Сумма 0 руб.: invalidAmount", 0, 1000, false, .invalidAmount, hint: "Ноль — тоже неправильная сумма: проверь условие amount > 0")
__t_error("Отрицательная сумма: invalidAmount", -500, 1000, false, .invalidAmount)
__t_error("Карта заблокирована: cardBlocked", 300, 1000, true, .cardBlocked, hint: "Если isCardBlocked равно true, брось PaymentError.cardBlocked")
__t_error("Не хватает 1 руб.: insufficientFunds", 1001, 1000, false, .insufficientFunds, hint: "1001 больше 1000 — денег не хватает")
__t_error("Пустая карта: insufficientFunds", 200, 0, false, .insufficientFunds)
__t_error("Сумма 0 и карта заблокирована: сначала invalidAmount", 0, 1000, true, .invalidAmount, hint: "Порядок проверок: сумма, карта, баланс")
__t_error("Карта заблокирована и денег мало: сначала cardBlocked", 5000, 1000, true, .cardBlocked, hint: "Блокировка карты проверяется раньше баланса")
```

## @rules
- must: /\bthrow\s+PaymentError\.|\bthrow\s+\./ :: Причину отказа нужно сообщать через `throw PaymentError.…` — в коде этого не видно.
- mustnot: /return\s+-\s*1\b/ :: Больше не возвращай `-1` при отказе — вместо этого бросай ошибку.

## @hint1
Начни с перечисления. Чтобы его значения можно было бросать, после имени `PaymentError` поставь двоеточие и название протокола `Error`. Внутри допиши ещё два случая — для заблокированной карты и для нехватки денег. Имена возьми из задания.

Потом объявление функции. Между закрывающей скобкой параметров и стрелкой допиши слово, которое говорит «эта функция может бросить ошибку».

Теперь три проверки внутри функции, по одной на каждый комментарий. Удобнее всего `guard`: в нём пишут условие, при котором всё **хорошо**, а в блоке `else` — что делать, если плохо. Только вместо `return` в `else` теперь стоит `throw` и нужный случай перечисления.

Последнюю строку с вычитанием не трогай: до неё дело дойдёт, только если все проверки пройдены.

## @hint2
Перечисление-ошибка и одна проверка выглядят так — на примере ПИН-кода:

```swift
enum PinError: Error {
    case wrongLength
    case tooSimple
}

func checkNewPin(_ pin: String) throws {
    guard pin.count == 4 else {
        throw PinError.wrongLength
    }
}
```

В твоей функции `throws` встанет перед стрелкой: `) throws -> Int {`.

## @hint3
Каркас почти готов, заполни пропуски:

```swift
enum PaymentError: ___ {
    case invalidAmount
    case cardBlocked
    case insufficientFunds
}

func pay(amount: Int, balance: Int, isCardBlocked: Bool) ___ -> Int {
    guard amount > 0 else {
        throw PaymentError.invalidAmount
    }
    guard !isCardBlocked else {
        ___ PaymentError.cardBlocked
    }
    guard ___ else {
        throw PaymentError.insufficientFunds
    }
    return balance - amount
}
```

В первом пропуске — протокол для ошибок. Во втором — слово, которое разрешает функции бросать ошибки. В третьем — слово, которое бросает ошибку. В четвёртом — условие, при котором денег хватает.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `PaymentError` подписано на `Error`, поэтому его случаи можно бросать. Функция помечена `throws` — без этого слова Swift не разрешил бы писать внутри `throw`. Каждый `guard` проверяет одно правило. Если оно нарушено, `throw` сразу завершает функцию и отдаёт наружу ошибку с причиной. До строки `return balance - amount` выполнение доходит, только когда все три проверки пройдены.

**Почему так лучше, чем `-1`.** Раньше результат `-1` значил «что-то не так», и экрану приходилось гадать, что именно. Теперь у функции два честных исхода: число (новый баланс) или ошибка с понятным именем. Число `-1` легко случайно показать покупателю как баланс. Ошибку так не перепутаешь: Swift заставит вызывающий код написать `try` и решить, что с ней делать.

**Почему условия именно такие.** В `guard` пишут, когда всё **хорошо**: сумма больше нуля, карта не заблокирована, сумма не больше баланса. Отсюда `amount <= balance`: если сумма ровно равна балансу, платёж проходит, и на карте остаётся `0`.

**Типичные ошибки:**

- забыто `: Error` у перечисления — тогда `throw PaymentError.cardBlocked` не соберётся;
- забыто `throws` в объявлении функции — компилятор сообщит, что ошибка `is not handled because the enclosing function is not declared 'throws'`;
- `throws` поставлено после стрелки: `-> Int throws` — оно должно стоять перед ней;
- `amount < balance` вместо `amount <= balance` — тогда нельзя потратить деньги до последнего рубля;
- проверки стоят в другом порядке — при нескольких проблемах сразу функция назовёт не ту причину.
