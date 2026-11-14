---
title: Сервис возвратов
concept: Итог модуля — типизированные throws(Тип), ошибки, Result
---

## @description

### Контекст
Финальная задача модуля. «Монета» запускает сервис возвратов. Покупатель отказался от заказа — магазин возвращает ему деньги, целиком или частями. Правила возврата прописаны в договоре с банком, и они строгие:

- вернуть можно только по существующему платежу;
- сумма возврата больше нуля;
- вернуть деньги можно не позже чем через 14 дней после платежа;
- всего по платежу нельзя вернуть больше, чем было заплачено. Если часть уже вернули, остаётся только разница.

Возвраты нужны в двух местах. На экране магазина — по одному, с понятным текстом. А служба поддержки присылает заявки пачкой, и по каждой нужен отдельный результат.

Тимлид добавляет: «Список ошибок возврата закрыт — он записан в договоре. Давай это и в коде зафиксируем: пусть `refund` обещает бросать только `RefundError`. Тогда экрану не придётся гадать».

### Новое в Swift
Обычный `throws` говорит «могу бросить ошибку», но не говорит какую. Поэтому в каждом `do-catch` нужен общий `catch`, а чтобы прочитать свойство ошибки, её приходится приводить через `as`.

**Типизированный `throws`** называет тип ошибки прямо в объявлении — в круглых скобках:

```swift
enum PinChangeError: Error {
    case wrongOldPin
    case sameAsOld
}

func changePin(old: String, new: String, current: String) throws(PinChangeError) {
    guard old == current else {
        throw .wrongOldPin
    }
    guard new != old else {
        throw .sameAsOld
    }
}
```

Что это даёт:

- **Swift следит за обещанием.** Бросить из `changePin` ошибку другого типа не получится — код не соберётся.
- **Короткая запись.** Тип ошибки известен, поэтому хватает точки: `throw .sameAsOld`. С обычным `throws` так не выйдет: компилятор не знает тип и напишет `type 'any Error' has no member 'sameAsOld'`.
- **В `catch` ошибка уже нужного типа.** Константа `error` имеет тип `PinChangeError`, а не «какая-то ошибка». Её можно сразу разобрать в `switch` или прочитать её свойство. Общий `catch` для чужих ошибок не нужен — их не бывает.

```swift
do {
    try changePin(old: "1111", new: "1111", current: "1111")
} catch {
    switch error {
    case .wrongOldPin:
        print("Старый ПИН-код введён неверно")
    case .sameAsOld:
        print("Новый ПИН-код совпадает со старым")
    }
}
```

> 💡 В большинстве кода по-прежнему пишут обычный `throws`: его проще менять, когда появляются новые причины ошибок. Типизированный выбирают, когда список ошибок закрыт и стабилен — как правила возврата из договора.

**Что ещё пригодится из модуля:**

- ошибка со связанными значениями и свойство `userMessage` в расширении — как у `CheckoutError` в задаче про цепочку оплаты;
- `Result` и `.success(...)` / `.failure(...)` — из задачи про ответ сервера;
- `Payment` — структура. Если достать её из словаря в переменную и изменить, изменится копия. Чтобы изменение сохранилось, копию кладут обратно в словарь — ты делала так в «Уюте». Достать значение, которое потом будешь менять, можно через `guard var` — это тот же `guard let`, только с переменной.

### Задача
В редакторе есть структуры `Payment` и `RefundRequest` и заготовка класса `RefundService` со словарём платежей `payments` и сроком `refundWindowDays`.

1. Допиши перечисление `RefundError`. Оно уже подписано на `Error` — добавь через запятую `Equatable`, чтобы ошибки можно было сравнивать через `==`, и четыре случая:
   - `paymentNotFound(id: String)` — платежа с таким `id` нет;
   - `invalidAmount` — сумма не больше нуля;
   - `windowClosed(daysPassed: Int)` — с платежа прошло больше 14 дней;
   - `exceedsAvailable(available: Int)` — сумма больше, чем ещё можно вернуть.
2. В расширении `RefundError` напиши вычисляемое свойство `userMessage: String`:
   - `paymentNotFound` — `Платёж P-404 не найден`;
   - `invalidAmount` — `Сумма возврата должна быть больше нуля`;
   - `windowClosed` — `Срок возврата истёк. Прошло дней: 20`;
   - `exceedsAvailable` — `Доступно для возврата: 700 руб.`
3. Допиши метод `refund(paymentId:amount:)`. Он помечен **`throws(RefundError)`** и возвращает `Int` — сколько ещё можно вернуть по платежу после этого возврата. Проверки по порядку:
   1. платежа нет в `payments` — `paymentNotFound` с этим `id`;
   2. `amount` не больше нуля — `invalidAmount`;
   3. `daysAgo` у платежа больше `refundWindowDays` — `windowClosed` с `daysAgo`. Ровно 14 дней — ещё можно;
   4. доступная для возврата сумма — это `amount` платежа минус его `refunded`. Если сумма возврата больше доступной — `exceedsAvailable` с доступной суммой;
   5. иначе увеличить `refunded` платежа на `amount` **и сохранить платёж в `payments`**, а вернуть оставшуюся доступную сумму.
4. Допиши метод `refundMessage(paymentId:amount:)` → `String`:
   - успех — `Возврат 300 руб. оформлен. Можно вернуть ещё: 700 руб.`;
   - ошибка — её `userMessage`.
5. Допиши метод `processAll(_:)`. Он получает `[RefundRequest]` и возвращает `[Result<Int, RefundError>]` — по одному результату на каждую заявку, в том же порядке. Заявки выполняются по очереди, так что каждая видит возвраты предыдущих.

### Пример
```swift
let service = RefundService(payments: [
    Payment(id: "P-101", amount: 1000, daysAgo: 3),
    Payment(id: "P-102", amount: 1500, daysAgo: 20)
])

service.refundMessage(paymentId: "P-101", amount: 300)
// "Возврат 300 руб. оформлен. Можно вернуть ещё: 700 руб."
service.refundMessage(paymentId: "P-101", amount: 900)
// "Доступно для возврата: 700 руб."
service.refundMessage(paymentId: "P-102", amount: 500)
// "Срок возврата истёк. Прошло дней: 20"

service.processAll([
    RefundRequest(paymentId: "P-101", amount: 700),
    RefundRequest(paymentId: "P-404", amount: 100)
])
// [.success(0), .failure(.paymentNotFound(id: "P-404"))]
```

## @starter
```swift
// Платёж, по которому можно оформить возврат
struct Payment {
    let id: String
    let amount: Int
    let daysAgo: Int        // сколько дней назад прошёл платёж
    var refunded: Int = 0   // сколько по нему уже вернули
}

// Заявка на возврат от службы поддержки
struct RefundRequest {
    let paymentId: String
    let amount: Int
}

// 1. Причины отказа в возврате: добавь Equatable и допиши случаи
enum RefundError: Error {
}

// 2. Тексты для покупателя
extension RefundError {
    var userMessage: String {
        return ""
    }
}

// Сервис возвратов
final class RefundService {
    // Вернуть деньги можно не позже чем через 14 дней после платежа
    let refundWindowDays = 14
    var payments: [String: Payment] = [:]

    init(payments: [Payment]) {
        for payment in payments {
            self.payments[payment.id] = payment
        }
    }

    // 3. Возврат. Бросает только RefundError — укажи это в объявлении.
    //    Возвращает, сколько ещё можно вернуть по этому платежу
    func refund(paymentId: String, amount: Int) throws -> Int {
        return 0
    }

    // 4. Текст для экрана магазина
    func refundMessage(paymentId: String, amount: Int) -> String {
        return ""
    }

    // 5. Пачка заявок от поддержки: результат по каждой, в том же порядке
    func processAll(_ requests: [RefundRequest]) -> [Result<Int, RefundError>] {
        return []
    }
}

let service = RefundService(payments: [
    Payment(id: "P-101", amount: 1000, daysAgo: 3),
    Payment(id: "P-102", amount: 1500, daysAgo: 20)
])
print(service.refundMessage(paymentId: "P-101", amount: 300))
print(service.refundMessage(paymentId: "P-101", amount: 900))
print(service.refundMessage(paymentId: "P-102", amount: 500))
```

## @solution
```swift
// Платёж, по которому можно оформить возврат
struct Payment {
    let id: String
    let amount: Int
    let daysAgo: Int        // сколько дней назад прошёл платёж
    var refunded: Int = 0   // сколько по нему уже вернули
}

// Заявка на возврат от службы поддержки
struct RefundRequest {
    let paymentId: String
    let amount: Int
}

// 1. Причины отказа в возврате: добавь Equatable и допиши случаи
enum RefundError: Error, Equatable {
    case paymentNotFound(id: String)
    case invalidAmount
    case windowClosed(daysPassed: Int)
    case exceedsAvailable(available: Int)
}

// 2. Тексты для покупателя
extension RefundError {
    var userMessage: String {
        switch self {
        case .paymentNotFound(let id):
            return "Платёж \(id) не найден"
        case .invalidAmount:
            return "Сумма возврата должна быть больше нуля"
        case .windowClosed(let daysPassed):
            return "Срок возврата истёк. Прошло дней: \(daysPassed)"
        case .exceedsAvailable(let available):
            return "Доступно для возврата: \(available) руб."
        }
    }
}

// Сервис возвратов
final class RefundService {
    // Вернуть деньги можно не позже чем через 14 дней после платежа
    let refundWindowDays = 14
    var payments: [String: Payment] = [:]

    init(payments: [Payment]) {
        for payment in payments {
            self.payments[payment.id] = payment
        }
    }

    // 3. Возврат. Бросает только RefundError — укажи это в объявлении.
    //    Возвращает, сколько ещё можно вернуть по этому платежу
    func refund(paymentId: String, amount: Int) throws(RefundError) -> Int {
        guard var payment = payments[paymentId] else {
            throw .paymentNotFound(id: paymentId)
        }
        guard amount > 0 else {
            throw .invalidAmount
        }
        guard payment.daysAgo <= refundWindowDays else {
            throw .windowClosed(daysPassed: payment.daysAgo)
        }
        let available = payment.amount - payment.refunded
        guard amount <= available else {
            throw .exceedsAvailable(available: available)
        }
        payment.refunded += amount
        payments[paymentId] = payment
        return available - amount
    }

    // 4. Текст для экрана магазина
    func refundMessage(paymentId: String, amount: Int) -> String {
        do {
            let left = try refund(paymentId: paymentId, amount: amount)
            return "Возврат \(amount) руб. оформлен. Можно вернуть ещё: \(left) руб."
        } catch {
            return error.userMessage
        }
    }

    // 5. Пачка заявок от поддержки: результат по каждой, в том же порядке
    func processAll(_ requests: [RefundRequest]) -> [Result<Int, RefundError>] {
        var results: [Result<Int, RefundError>] = []
        for request in requests {
            do {
                let left = try refund(paymentId: request.paymentId, amount: request.amount)
                results.append(.success(left))
            } catch {
                results.append(.failure(error))
            }
        }
        return results
    }
}

let service = RefundService(payments: [
    Payment(id: "P-101", amount: 1000, daysAgo: 3),
    Payment(id: "P-102", amount: 1500, daysAgo: 20)
])
print(service.refundMessage(paymentId: "P-101", amount: 300))
print(service.refundMessage(paymentId: "P-101", amount: 900))
print(service.refundMessage(paymentId: "P-102", amount: 500))
```

## @tests
```swift
func __t_service() -> RefundService {
    return RefundService(payments: [
        Payment(id: "P-1", amount: 1000, daysAgo: 3),
        Payment(id: "P-2", amount: 2500, daysAgo: 14),
        Payment(id: "P-3", amount: 800, daysAgo: 15),
        Payment(id: "P-4", amount: 5000, daysAgo: 0, refunded: 4000)
    ])
}

func __t_refund(_ service: RefundService, _ id: String, _ amount: Int) -> String {
    do {
        let left = try service.refund(paymentId: id, amount: amount)
        return "успех, можно вернуть ещё \(left)"
    } catch {
        return "ошибка \(error)"
    }
}

func __t_show(_ result: Result<Int, RefundError>) -> String {
    switch result {
    case .success(let value):
        return "success(\(value))"
    case .failure(let error):
        return "failure(\(error))"
    }
}

__ok("RefundError можно сравнивать через ==", RefundError.windowClosed(daysPassed: 20) == .windowClosed(daysPassed: 20), hint: "Подпиши RefundError на Equatable: enum RefundError: Error, Equatable")

__eq("Текст: платёж не найден", RefundError.paymentNotFound(id: "P-404").userMessage, "Платёж P-404 не найден")
__eq("Текст: неверная сумма", RefundError.invalidAmount.userMessage, "Сумма возврата должна быть больше нуля")
__eq("Текст: прошло 20 дней", RefundError.windowClosed(daysPassed: 20).userMessage, "Срок возврата истёк. Прошло дней: 20", hint: "Число дней возьми из ошибки")
__eq("Текст: прошёл 31 день", RefundError.windowClosed(daysPassed: 31).userMessage, "Срок возврата истёк. Прошло дней: 31")
__eq("Текст: доступно 700 руб.", RefundError.exceedsAvailable(available: 700).userMessage, "Доступно для возврата: 700 руб.", hint: "Сумму возьми из ошибки")

let __t_s1 = __t_service()
__eq("Возврат 300 из 1000 руб.", __t_refund(__t_s1, "P-1", 300), "успех, можно вернуть ещё 700", hint: "Метод возвращает, сколько ещё можно вернуть: amount - refunded платежа минус этот возврат")
__eq("После возврата 300 руб. платёж обновлён в словаре", __t_s1.payments["P-1"]?.refunded, 300, hint: "Payment — структура: после изменения положи её обратно в payments[paymentId]")
__eq("Второй возврат — ровно остаток 700 руб.", __t_refund(__t_s1, "P-1", 700), "успех, можно вернуть ещё 0", hint: "Вернуть ровно доступную сумму можно")
__eq("Третий возврат по полностью возвращённому платежу", __t_refund(__t_s1, "P-1", 1), "ошибка exceedsAvailable(available: 0)", hint: "Доступно amount - refunded. После двух возвратов это 0")

let __t_s2 = __t_service()
__eq("Возврат больше платежа на 1 руб.", __t_refund(__t_s2, "P-1", 1001), "ошибка exceedsAvailable(available: 1000)")
__eq("После отказа платёж не изменился", __t_s2.payments["P-1"]?.refunded, 0, hint: "Если возврат не прошёл, refunded меняться не должен")
__eq("Часть уже вернули: доступно 1000 из 5000 руб.", __t_refund(__t_s2, "P-4", 1500), "ошибка exceedsAvailable(available: 1000)", hint: "Учитывай уже возвращённое: доступно amount - refunded")
__eq("Часть уже вернули: возврат ровно 1000 руб.", __t_refund(__t_s2, "P-4", 1000), "успех, можно вернуть ещё 0")
__eq("Ровно 14 дней — вернуть ещё можно", __t_refund(__t_s2, "P-2", 2500), "успех, можно вернуть ещё 0", hint: "Ошибка нужна, только когда daysAgo больше refundWindowDays")
__eq("15 дней — срок истёк", __t_refund(__t_s2, "P-3", 100), "ошибка windowClosed(daysPassed: 15)")
__eq("Платежа нет", __t_refund(__t_s2, "P-404", 100), "ошибка paymentNotFound(id: \"P-404\")")
__eq("Сумма 0", __t_refund(__t_s2, "P-1", 0), "ошибка invalidAmount")
__eq("Отрицательная сумма", __t_refund(__t_s2, "P-1", -50), "ошибка invalidAmount")
__eq("Порядок: сначала поиск платежа, потом сумма", __t_refund(__t_s2, "P-404", 0), "ошибка paymentNotFound(id: \"P-404\")", hint: "Порядок проверок: платёж, сумма, срок, доступная сумма")
__eq("Порядок: сумма проверяется раньше срока", __t_refund(__t_s2, "P-3", 0), "ошибка invalidAmount", hint: "Порядок проверок: платёж, сумма, срок, доступная сумма")
__eq("Порядок: срок проверяется раньше доступной суммы", __t_refund(__t_s2, "P-3", 9999), "ошибка windowClosed(daysPassed: 15)", hint: "Порядок проверок: платёж, сумма, срок, доступная сумма")

let __t_s3 = __t_service()
__eq("Экран: возврат 300 руб.", __t_s3.refundMessage(paymentId: "P-1", amount: 300), "Возврат 300 руб. оформлен. Можно вернуть ещё: 700 руб.")
__eq("Экран: возврат остатка 700 руб.", __t_s3.refundMessage(paymentId: "P-1", amount: 700), "Возврат 700 руб. оформлен. Можно вернуть ещё: 0 руб.", hint: "Каждый возврат должен сохраняться в payments")
__eq("Экран: возвращать больше нечего", __t_s3.refundMessage(paymentId: "P-1", amount: 100), "Доступно для возврата: 0 руб.", hint: "Для ошибки верни её userMessage")
__eq("Экран: платёж не найден", __t_s3.refundMessage(paymentId: "P-777", amount: 100), "Платёж P-777 не найден")
__eq("Экран: срок истёк", __t_s3.refundMessage(paymentId: "P-3", amount: 100), "Срок возврата истёк. Прошло дней: 15")
__eq("Экран: сумма 0", __t_s3.refundMessage(paymentId: "P-2", amount: 0), "Сумма возврата должна быть больше нуля")

let __t_s4 = __t_service()
let __t_batch = __t_s4.processAll([
    RefundRequest(paymentId: "P-1", amount: 600),
    RefundRequest(paymentId: "P-1", amount: 600),
    RefundRequest(paymentId: "P-9", amount: 100),
    RefundRequest(paymentId: "P-1", amount: 400),
    RefundRequest(paymentId: "P-3", amount: 100)
])
__eq("Пачка: по результату на каждую заявку, в том же порядке", __t_batch.map(__t_show), ["success(400)", "failure(exceedsAvailable(available: 400))", "failure(paymentNotFound(id: \"P-9\"))", "success(0)", "failure(windowClosed(daysPassed: 15))"], hint: "Для каждой заявки по порядку вызови refund: успех — .success(остаток), ошибка — .failure(ошибка)")
__eq("Пачка: пустой список заявок", __t_service().processAll([]).map(__t_show), [])
```

## @rules
- must: /throws\s*\(\s*RefundError\s*\)/ :: Метод `refund` должен обещать бросать только `RefundError`: `throws(RefundError)`.

## @hint1
Начни с перечисления: после `Error` через запятую допиши `Equatable`. Четыре случая возьми из задания, вместе с метками и типами.

`userMessage` — `switch self` с четырьмя ветками. Там, где у ошибки есть значение, достань его через `let` и вставь в текст.

`refund` начни с объявления: вместо `throws` напиши `throws` и в скобках тип ошибки. Первым шагом достань платёж из словаря через `guard var` — именно `var`, потому что дальше платёж будет меняться. Потом по очереди `guard` на сумму, на срок и на доступную сумму. Доступную сумму сначала посчитай в константу: она нужна и для ошибки, и для результата. В конце увеличь `refunded`, положи платёж обратно в `payments` по тому же ключу и верни, сколько осталось.

`refundMessage` — `do-catch` с одним `catch` без условия: внутри него `error` уже имеет тип `RefundError`.

`processAll` — пустой массив результатов, цикл по заявкам и `do-catch` внутри цикла. Успех добавляй как `.success`, ошибку — как `.failure`.

## @hint2
Объявление с типизированным `throws` и ловля без приведения типа — на примере смены ПИН-кода:

```swift
func changePin(old: String, new: String, current: String) throws(PinChangeError) {
    guard old == current else {
        throw .wrongOldPin
    }
}

do {
    try changePin(old: "1111", new: "2222", current: "1234")
} catch {
    print(error.userMessage)   // error — уже PinChangeError
}
```

А изменение структуры из словаря выглядит так:

```swift
guard var payment = payments[paymentId] else { ... }
payment.refunded += amount
payments[paymentId] = payment
```

## @hint3
Заполни пропуски — остальное уже на месте:

```swift
func refund(paymentId: String, amount: Int) throws(___) -> Int {
    guard var payment = payments[paymentId] else {
        throw .paymentNotFound(id: paymentId)
    }
    guard amount > 0 else {
        throw .invalidAmount
    }
    guard payment.daysAgo <= refundWindowDays else {
        throw .windowClosed(daysPassed: payment.daysAgo)
    }
    let available = ___
    guard amount <= available else {
        throw .exceedsAvailable(available: available)
    }
    payment.refunded += amount
    ___ = payment
    return available - amount
}

func refundMessage(paymentId: String, amount: Int) -> String {
    do {
        let left = try refund(paymentId: paymentId, amount: amount)
        return "Возврат \(amount) руб. оформлен. Можно вернуть ещё: \(left) руб."
    } catch {
        return error.___
    }
}

func processAll(_ requests: [RefundRequest]) -> [Result<Int, RefundError>] {
    var results: [Result<Int, RefundError>] = []
    for request in requests {
        do {
            let left = try refund(paymentId: request.paymentId, amount: request.amount)
            results.append(___)
        } catch {
            results.append(.failure(error))
        }
    }
    return results
}
```

По порядку: тип ошибки; сколько ещё можно вернуть по платежу; куда положить изменённый платёж; свойство с текстом; успешный результат с остатком. Перечисление и `userMessage` напиши сама — по образцу `CheckoutError` из задачи про цепочку оплаты.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `refund` — пропускной пункт из четырёх `guard`, как во всём модуле. Благодаря `throws(RefundError)` броски записаны коротко: `throw .invalidAmount`. Swift гарантирует, что никакая другая ошибка из метода не выйдет. Доступная сумма считается один раз и используется дважды: в ошибке `exceedsAvailable` и в результате.

**Почему платёж кладётся обратно.** `Payment` — структура, а структуры копируются. `guard var payment = payments[paymentId]` достаёт из словаря **копию**. Если увеличить `refunded` у копии и не сохранить её, словарь ничего не узнает. Тогда второй возврат по тому же платежу снова увидит `refunded == 0`, и можно будет вернуть больше, чем заплатили. Строка `payments[paymentId] = payment` записывает изменённую копию на место старой.

**Что дал типизированный `throws`.** Посмотри на `refundMessage`: один `catch` без условия, и в нём сразу `error.userMessage`. Нет приведения через `as` и нет общего `catch` «на всякий случай». В `processAll` то же: `.failure(error)` подходит для массива `[Result<Int, RefundError>]` без преобразований. С обычным `throws` здесь понадобились бы `catch let error as RefundError` и запасная ветка для ошибок, которых на самом деле не бывает.

**Почему `processAll` возвращает `Result`, а не бросает.** Пачка не должна останавливаться на первой неудачной заявке: поддержке нужен ответ по каждой. `Result` позволяет сохранить в одном массиве и успехи, и ошибки — по порядку заявок.

**Типичные ошибки:**

- платёж изменён, но не сохранён в `payments` — второй возврат «не видит» первый;
- доступная сумма посчитана как `payment.amount` без вычета `refunded`;
- `daysAgo >= refundWindowDays` в условии ошибки — тогда ровно 14 дней уже не подходят;
- в объявлении остался обычный `throws` — тогда короткое `throw .invalidAmount` не соберётся (`type 'any Error' has no member`), а в `catch` ошибка будет иметь тип `any Error`, и `error.userMessage` тоже не сработает.
