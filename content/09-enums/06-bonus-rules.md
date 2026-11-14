---
title: Бонусы за поездку
concept: Сопоставление с образцом — if case, guard case, where
---

## @description

### Контекст
Отдел маркетинга запускает программу лояльности «Попутный ветер»: за поездки пассажиру начисляются бонусы. Правила пришли списком. За дорогую поездку бонусов больше. Если поездку отменил водитель, пассажир получает компенсацию. Если отменил сам пассажир — ничего.

Заодно пришли две просьбы от соседних команд. Аналитикам нужно знать, сколько денег принесла каждая поездка. А служба поддержки хочет автоматически извиняться перед пассажиром, которого подвёл водитель.

Тимлид смотрит на список и замечает: «В двух функциях из трёх тебя интересует один-единственный вариант. Полный `switch` ради него — лишний шум. Для таких случаев есть запись короче».

### Новое в Swift
Запись вида `.message(let text)` называется **образцом**. Swift сравнивает с ним значение: если вариант совпал — достаёт данные. До сих пор ты писала образцы только в ветках `switch`. Но они работают и в других местах.

Примеры будут про уведомления:

```swift
enum AppNotification {
    case driverArrived
    case message(text: String)
    case promo(percent: Int)
}

let notification = AppNotification.message(text: "Буду через минуту")
```

**`if case` — когда важен один вариант.** После `if` пишут слово `case`, образец, знак `=` и значение, которое проверяют:

```swift
if case .message(let text) = notification {
    print("Новое сообщение: \(text)")
}
```

Читается так: «если `notification` — это вариант `message`, достань его текст в константу `text` и выполни блок». Порядок непривычный: образец стоит слева от `=`, а проверяемое значение — справа. Константа `text` существует только внутри фигурных скобок.

У варианта без данных скобок нет: `if case .driverArrived = notification { ... }`.

**`guard case` — то же самое с ранним выходом.** Как и обычный `guard`, он проверяет условие в начале функции. Если вариант не тот — выходит. Если тот — данные доступны до конца функции:

```swift
func messagePreview(for notification: AppNotification) -> String? {
    guard case .message(let text) = notification else {
        return nil
    }
    return "Сообщение: \(text)"
}
```

**`where` — условие на данные варианта.** Слово `where` в ветках `switch` тебе знакомо. Оно умеет проверять и значения, которые только что достал `let`:

```swift
func badge(for notification: AppNotification) -> String {
    switch notification {
    case .promo(let percent) where percent >= 30:
        return "Большая скидка: \(percent)%"
    case .promo(let percent):
        return "Скидка: \(percent)%"
    case .message, .driverArrived:
        return "Без скидки"
    }
}
```

Первая ветка срабатывает, только если это `promo` **и** скидка не меньше 30. Остальные промо попадают во вторую. Правило прежнее: ветка с `where` стоит выше обычной ветки того же варианта, потому что Swift берёт первую подходящую.

В последней ветке видно ещё одно: если данные варианта не нужны, скобки с `let` можно не писать. `case .message:` подходит для любого сообщения.

> 💡 В `if case` дополнительное условие пишут через запятую: `if case .promo(let percent) = notification, percent >= 30 { ... }`.

### Задача
В редакторе уже есть перечисление `RideResult` — чем закончилась поездка. Допиши три функции.

1. `paidAmount(for:)` возвращает `Int` — сколько денег принесла поездка. Для завершённой поездки это её цена, для любой отменённой — `0`. Напиши через `if case`.
2. `apologyText(for:)` возвращает `String?`. Если поездку отменил водитель — текст вида `Водитель отменил поездку: сломалась машина. Вам начислено 50 бонусов.` После двоеточия стоит причина из данных варианта, после неё точка. В остальных случаях функция возвращает `nil`. Начни её с `guard case`.
3. `bonusPoints(for:)` возвращает `Int` — бонусы за поездку:
   - завершённая поездка ценой от 1000 руб. — 10% цены: `price / 10`;
   - завершённая поездка дешевле 1000 руб. — 5% цены: `price / 20`;
   - поездку отменил водитель — `50` бонусов;
   - поездку отменил пассажир — `0`.

   Напиши через `switch`, а дорогие поездки выдели веткой с `where`.

### Пример
```swift
paidAmount(for: .completed(price: 380))        // 380
paidAmount(for: .cancelledByPassenger)         // 0
apologyText(for: .cancelledByPassenger)        // nil
bonusPoints(for: .completed(price: 1000))      // 100
bonusPoints(for: .completed(price: 380))       // 19
```

Проба в конце кода напечатает:

```text
Оплачено: 1250 руб., бонусов: 125
Оплачено: 0 руб., бонусов: 50
Оплачено: 380 руб., бонусов: 19
Водитель отменил поездку: сломалась машина. Вам начислено 50 бонусов.
```

## @starter
```swift
// Чем закончилась поездка
enum RideResult {
    case completed(price: Int)
    case cancelledByPassenger
    case cancelledByDriver(reason: String)
}

// 1. Сколько денег принесла поездка: цена завершённой поездки, иначе 0
func paidAmount(for result: RideResult) -> Int {
    // Замени заглушку: проверь один вариант через if case
    return 0
}

// 2. Извинение, если поездку отменил водитель. В остальных случаях nil
func apologyText(for result: RideResult) -> String? {
    // Замени заглушку: начни с guard case
    return nil
}

// 3. Бонусы за поездку по правилам программы лояльности
func bonusPoints(for result: RideResult) -> Int {
    // Замени заглушку: switch, дорогие поездки - веткой с where
    return 0
}

// Проба: три поездки за вечер
let evening: [RideResult] = [
    .completed(price: 1250),
    .cancelledByDriver(reason: "сломалась машина"),
    .completed(price: 380)
]
for ride in evening {
    print("Оплачено: \(paidAmount(for: ride)) руб., бонусов: \(bonusPoints(for: ride))")
}
print(apologyText(for: evening[1]) ?? "Извиняться не за что")
```

## @solution
```swift
// Чем закончилась поездка
enum RideResult {
    case completed(price: Int)
    case cancelledByPassenger
    case cancelledByDriver(reason: String)
}

// 1. Сколько денег принесла поездка: цена завершённой поездки, иначе 0
func paidAmount(for result: RideResult) -> Int {
    if case .completed(let price) = result {
        return price
    }
    return 0
}

// 2. Извинение, если поездку отменил водитель. В остальных случаях nil
func apologyText(for result: RideResult) -> String? {
    guard case .cancelledByDriver(let reason) = result else {
        return nil
    }
    return "Водитель отменил поездку: \(reason). Вам начислено 50 бонусов."
}

// 3. Бонусы за поездку по правилам программы лояльности
func bonusPoints(for result: RideResult) -> Int {
    switch result {
    case .completed(let price) where price >= 1000:
        return price / 10
    case .completed(let price):
        return price / 20
    case .cancelledByDriver:
        return 50
    case .cancelledByPassenger:
        return 0
    }
}

// Проба: три поездки за вечер
let evening: [RideResult] = [
    .completed(price: 1250),
    .cancelledByDriver(reason: "сломалась машина"),
    .completed(price: 380)
]
for ride in evening {
    print("Оплачено: \(paidAmount(for: ride)) руб., бонусов: \(bonusPoints(for: ride))")
}
print(apologyText(for: evening[1]) ?? "Извиняться не за что")
```

## @tests
```swift
func __t_text(_ value: String?) -> String { value ?? "nil" }
__eq("paidAmount: завершённая поездка за 380 руб.", paidAmount(for: .completed(price: 380)), 380, hint: "Для завершённой поездки верни цену из данных варианта: if case .completed(let price) = result")
__eq("paidAmount: завершённая поездка за 1250 руб.", paidAmount(for: .completed(price: 1250)), 1250, hint: "Цена должна браться из данных варианта .completed")
__eq("paidAmount: поездку отменил пассажир", paidAmount(for: .cancelledByPassenger), 0, hint: "Отменённая поездка денег не принесла: верни 0")
__eq("paidAmount: поездку отменил водитель", paidAmount(for: .cancelledByDriver(reason: "сломалась машина")), 0, hint: "Отменённая поездка денег не принесла: верни 0")
__eq("apologyText: водитель отменил, потому что сломалась машина", __t_text(apologyText(for: .cancelledByDriver(reason: "сломалась машина"))), "Водитель отменил поездку: сломалась машина. Вам начислено 50 бонусов.", hint: "Сверь текст с условием: после двоеточия причина, затем точка и фраза про 50 бонусов")
__eq("apologyText: водитель отменил, потому что попал в пробку", __t_text(apologyText(for: .cancelledByDriver(reason: "попал в пробку"))), "Водитель отменил поездку: попал в пробку. Вам начислено 50 бонусов.", hint: "Причина должна браться из данных варианта: guard case .cancelledByDriver(let reason) = result")
__ok("apologyText: поездку отменил пассажир - извиняться не за что", apologyText(for: .cancelledByPassenger) == nil, hint: "Если поездку отменил не водитель, функция возвращает nil")
__ok("apologyText: поездка завершена - извиняться не за что", apologyText(for: .completed(price: 640)) == nil, hint: "Если поездку отменил не водитель, функция возвращает nil")
__eq("bonusPoints: поездка за 380 руб. - 5%", bonusPoints(for: .completed(price: 380)), 19, hint: "Поездка дешевле 1000 руб. даёт 5% цены: price / 20")
__eq("bonusPoints: поездка за 999 руб. - ещё 5%", bonusPoints(for: .completed(price: 999)), 49, hint: "999 руб. меньше 1000, поэтому бонусы считаются как price / 20")
__eq("bonusPoints: поездка ровно за 1000 руб. - уже 10%", bonusPoints(for: .completed(price: 1000)), 100, hint: "Поездка ровно за 1000 руб. уже считается дорогой: условие price >= 1000. И ветка с where должна стоять выше обычной ветки .completed")
__eq("bonusPoints: поездка за 1250 руб. - 10%", bonusPoints(for: .completed(price: 1250)), 125, hint: "Поездка от 1000 руб. даёт 10% цены: price / 10. Ветка с where должна стоять выше обычной ветки .completed")
__eq("bonusPoints: бесплатная поездка за 0 руб.", bonusPoints(for: .completed(price: 0)), 0, hint: "Бонусы считаются от цены: 5% от нуля - это 0")
__eq("bonusPoints: поездку отменил водитель - компенсация 50 бонусов", bonusPoints(for: .cancelledByDriver(reason: "попал в пробку")), 50, hint: "Если поездку отменил водитель, пассажир получает 50 бонусов при любой причине")
__eq("bonusPoints: поездку отменил пассажир - бонусов нет", bonusPoints(for: .cancelledByPassenger), 0, hint: "Если поездку отменил пассажир, бонусы не начисляются")
```

## @rules
- must: /\bif\s+case\b/ :: В `paidAmount(for:)` проверь один нужный вариант через `if case`: `if case .completed(let price) = result { ... }`.
- must: /\bguard\s+case\b/ :: Функцию `apologyText(for:)` начни с `guard case`: если поездку отменил не водитель, сразу верни `nil`.
- must: /\bcase\b[^:\n]*\.completed\b[^:\n]*\bwhere\b/ :: В `bonusPoints(for:)` выдели дорогие поездки веткой с `where`: `case .completed(let price) where price >= 1000:`.

## @hint1
Перечисление `RideResult` готово, менять его не нужно. В каждой функции замени заглушку своим кодом.

`paidAmount(for:)`. Тебя интересует один вариант — завершённая поездка. После `if` напиши `case`, затем образец: вариант `completed` с точкой, а в скобках `let` и имя для цены. Дальше знак `=` и параметр `result`. Внутри блока верни цену. После блока, для всех остальных случаев, верни ноль.

`apologyText(for:)`. Здесь тоже нужен один вариант — отмена водителем, но оформи проверку как ранний выход. Начни с `guard case`, образец — вариант `cancelledByDriver` с `let` для причины, потом `=`, параметр и `else`. В блоке `else` верни `nil`. Ниже `guard` причина уже доступна: собери текст через интерполяцию и верни его.

`bonusPoints(for:)`. Тут важны все варианты, поэтому нужен `switch` по `result`. Для завершённой поездки понадобятся две ветки. В первой после образца с ценой стоит `where` и условие «цена не меньше 1000» — она возвращает десятую часть цены. Вторая — тот же образец без `where`, она возвращает двадцатую часть. Ветка с `where` должна стоять выше. Ещё две ветки возвращают 50 и 0. Данные отмены в них не нужны, поэтому скобки с `let` можно не писать.

## @hint2
Вот три записи на примере уведомлений:

```swift
// if case: один вариант, остальным - значение по умолчанию
func discountPercent(of notification: AppNotification) -> Int {
    if case .promo(let percent) = notification {
        return percent
    }
    return 0
}

// guard case: не тот вариант - сразу выходим
func messagePreview(for notification: AppNotification) -> String? {
    guard case .message(let text) = notification else {
        return nil
    }
    return "Сообщение: \(text)"
}

// where: условие на данные варианта
switch notification {
case .promo(let percent) where percent >= 30:
    print("Большая скидка")
case .promo:
    print("Скидка")
case .message, .driverArrived:
    print("Без скидки")
}
```

Образец всегда стоит слева от знака `=`, проверяемое значение — справа.

## @hint3
Каркас всех трёх функций готов. Заполни пропуски:

```swift
func paidAmount(for result: RideResult) -> Int {
    if case .completed(let price) = ___ {
        return price
    }
    return ___
}

func apologyText(for result: RideResult) -> String? {
    guard case .cancelledByDriver(let reason) = result else {
        return ___
    }
    return "Водитель отменил поездку: \(reason). Вам начислено 50 бонусов."
}

func bonusPoints(for result: RideResult) -> Int {
    switch result {
    case .completed(let price) where ___:
        return price / 10
    case .completed(let price):
        return price / 20
    case .cancelledByDriver:
        return 50
    case .cancelledByPassenger:
        return 0
    }
}
```

В первом пропуске — значение, которое проверяется. Во втором — сколько денег принесла отменённая поездка. В третьем — что вернуть, если извиняться не за что. В четвёртом — условие дорогой поездки: цена не меньше 1000.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** В `paidAmount(for:)` строка `if case .completed(let price) = result` делает то же, что одна ветка `switch`: проверяет вариант и достаёт цену. Если в `result` лежит отмена, блок пропускается, и функция доходит до `return 0`.

В `apologyText(for:)` логика перевёрнута. `guard case` сразу отсекает всё, что не подходит: поездку отменил не водитель — выходим с `nil`. После `guard` константа `reason` доступна до конца функции, и основной код идёт без лишних отступов.

В `bonusPoints(for:)` важны все четыре случая, поэтому там полный `switch`. Для завершённой поездки веток две. Swift идёт сверху вниз: сначала проверяет ветку с `where`, и если цена меньше 1000 — переходит к следующей, обычной. В ветках отмены данные не нужны, поэтому причина не достаётся: `case .cancelledByDriver:` подходит для любой причины.

**Почему не `switch` везде.** Функцию `paidAmount(for:)` можно написать через `switch` с тремя ветками, две из которых возвращают ноль. Работать будет, но читателю придётся просмотреть всё, чтобы понять простую мысль: «цена, если поездка завершена». `if case` говорит это одной строкой. Ориентир такой: один вариант интересен — `if case` или `guard case`; важны все — `switch`.

**Почему в `bonusPoints(for:)` нет `default`.** Если в перечисление добавят вариант «не удалось найти машину», Swift потребует решить, сколько бонусов за него положено. С `default` новый вариант молча получил бы ноль.

**Типичные ошибки:**

- образец и значение перепутаны местами: `if case result = .completed(let price)` — образец всегда слева от `=`;
- обычная ветка `.completed` стоит выше ветки с `where` — тогда до дорогих поездок очередь не доходит, и за 1000 рублей начисляется 5%;
- условие `price > 1000` вместо `>=` — поездка ровно за 1000 рублей получает меньше бонусов, чем обещано;
- вместо `=` написано `==`: `if case .completed(let price) == result` — в `if case` всегда один знак равенства.
