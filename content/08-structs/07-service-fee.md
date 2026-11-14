---
title: Сервисный сбор
concept: static — свойства и методы типа
---

## @description

### Контекст
«Уют» зарабатывает на сервисном сборе: к стоимости каждой брони добавляется процент. Ставка одна на всё приложение. Сейчас число 10 написано прямо в коде трёх экранов. Когда маркетинг провёл акцию со сбором 5%, один экран забыли поправить, и гости видели две разные суммы.

Тимлид: «Ставка должна лежать в одном месте — в модели брони. И второе: дизайнеры добавили кнопку "На выходные", она сразу создаёт бронь на две ночи. Сделай для неё готовый способ получить такую бронь».

### Новое в Swift
Все свойства, которые ты объявляла, принадлежали экземплярам: у каждой квартиры своя цена, у каждой брони свой статус. Но бывают данные, общие для всего типа. Их объявляют со словом `static`:

```swift
struct Coupon {
    static var maxPercent = 30

    let code: String
    let percent: Int
}
```

Статическое свойство существует в единственном числе. Оно принадлежит самому типу `Coupon`, а не отдельным купонам. Поэтому обращаются к нему через имя типа, с большой буквы:

```swift
print(Coupon.maxPercent)      // 30
```

`static let` — общая константа. `static var` — общая переменная: стоит её изменить, и новое значение увидят сразу все.

Внутри обычных методов и вычисляемых свойств к статическому свойству тоже обращаются через имя типа:

```swift
struct Coupon {
    static var maxPercent = 30

    let code: String
    let percent: Int

    var isAllowed: Bool {
        percent <= Coupon.maxPercent
    }
}

let coupon = Coupon(code: "VESNA", percent: 40)
print(coupon.isAllowed)        // false

Coupon.maxPercent = 50
print(coupon.isAllowed)        // true
```

Купон не менялся, но ответ стал другим: изменилось общее правило.

**Статические методы.** Слово `static` можно поставить и перед `func`. Такой метод вызывают у типа, а не у экземпляра. Самое частое применение — «фабричный» метод: он создаёт и возвращает готовый экземпляр, в котором часть значений известна заранее.

```swift
struct Coupon {
    static var maxPercent = 30

    let code: String
    let percent: Int

    static func welcome() -> Coupon {
        Coupon(code: "WELCOME", percent: 10)
    }
}

let gift = Coupon.welcome()
print(gift.code, gift.percent)     // WELCOME 10
```

Код `WELCOME` и его 10% записаны в одном месте. Любой экран получает приветственный купон одной строкой и не может ошибиться в деталях.

> 💡 На автоматический инициализатор статические свойства не влияют: в скобках по-прежнему перечисляют только обычные хранимые свойства.

### Задача
В редакторе есть структура `Booking` со свойствами `apartmentTitle`, `nights` и `pricePerNight`. Добавь в неё:

1. Статическую переменную `serviceFeePercent` со значением `10` — ставка сбора в процентах.
2. Вычисляемое свойство `serviceFee` типа `Int` — сбор в рублях. Это стоимость проживания (ночи, умноженные на цену за ночь), умноженная на ставку и делённая на 100.
3. Вычисляемое свойство `totalPrice` типа `Int` — стоимость проживания плюс сбор.
4. Статический метод `weekend(apartmentTitle:pricePerNight:)` — принимает название (`String`) и цену за ночь (`Int`), возвращает `Booking` на 2 ночи.

Не пиши число 10 прямо в формуле. Проверка изменит `Booking.serviceFeePercent` и посмотрит, пересчитался ли сбор.

Код экрана под структурой менять не нужно. Он уже пользуется новыми свойствами и методом, поэтому не соберётся, пока ты их не добавишь.

### Пример
```swift
let booking = Booking(apartmentTitle: "Студия у набережной", nights: 3, pricePerNight: 3200)
booking.serviceFee        // 960
booking.totalPrice        // 10560

Booking.serviceFeePercent = 5
booking.serviceFee        // 480

let weekend = Booking.weekend(apartmentTitle: "Дом у озера", pricePerNight: 7400)
weekend.nights            // 2
```

Экран должен вывести:

```text
Сбор сервиса: 10%
Дом у озера, ночей: 2
Сбор: 1480 руб., итого: 16280 руб.
По акции сбор сервиса: 5%
Сбор: 740 руб., итого: 15540 руб.
```

## @starter
```swift
struct Booking {
    // Добавь сюда статическую переменную serviceFeePercent


    let apartmentTitle: String
    let nights: Int
    let pricePerNight: Int

    // Добавь сюда serviceFee, totalPrice и статический метод weekend(apartmentTitle:pricePerNight:)

}

// Экран оформления. Этот код уже готов — менять его не нужно
let booking = Booking.weekend(apartmentTitle: "Дом у озера", pricePerNight: 7400)
print("Сбор сервиса: \(Booking.serviceFeePercent)%")
print("\(booking.apartmentTitle), ночей: \(booking.nights)")
print("Сбор: \(booking.serviceFee) руб., итого: \(booking.totalPrice) руб.")

// Маркетинг запустил акцию: сбор снижен до 5%
Booking.serviceFeePercent = 5
print("По акции сбор сервиса: \(Booking.serviceFeePercent)%")
print("Сбор: \(booking.serviceFee) руб., итого: \(booking.totalPrice) руб.")
```

## @solution
```swift
struct Booking {
    // Добавь сюда статическую переменную serviceFeePercent
    static var serviceFeePercent = 10

    let apartmentTitle: String
    let nights: Int
    let pricePerNight: Int

    // Добавь сюда serviceFee, totalPrice и статический метод weekend(apartmentTitle:pricePerNight:)
    var serviceFee: Int {
        nights * pricePerNight * Booking.serviceFeePercent / 100
    }

    var totalPrice: Int {
        nights * pricePerNight + serviceFee
    }

    static func weekend(apartmentTitle: String, pricePerNight: Int) -> Booking {
        Booking(apartmentTitle: apartmentTitle, nights: 2, pricePerNight: pricePerNight)
    }
}

// Экран оформления. Этот код уже готов — менять его не нужно
let booking = Booking.weekend(apartmentTitle: "Дом у озера", pricePerNight: 7400)
print("Сбор сервиса: \(Booking.serviceFeePercent)%")
print("\(booking.apartmentTitle), ночей: \(booking.nights)")
print("Сбор: \(booking.serviceFee) руб., итого: \(booking.totalPrice) руб.")

// Маркетинг запустил акцию: сбор снижен до 5%
Booking.serviceFeePercent = 5
print("По акции сбор сервиса: \(Booking.serviceFeePercent)%")
print("Сбор: \(booking.serviceFee) руб., итого: \(booking.totalPrice) руб.")
```

## @output
```
Сбор сервиса: 10%
Дом у озера, ночей: 2
Сбор: 1480 руб., итого: 16280 руб.
По акции сбор сервиса: 5%
Сбор: 740 руб., итого: 15540 руб.
```

## @tests
```swift
__ok("Ставка serviceFeePercent имеет тип Int", type(of: Booking.serviceFeePercent) == Int.self, hint: "Ставка — целое число процентов: static var serviceFeePercent = 10")

Booking.serviceFeePercent = 10
let __t_b = Booking(apartmentTitle: "Студия у набережной", nights: 3, pricePerNight: 3200)
__eq("3 ночи по 3200 при ставке 10%: сбор 960", __t_b.serviceFee, 960, hint: "Сбор = ночи * цена за ночь * ставка / 100")
__eq("3 ночи по 3200 при ставке 10%: итого 10560", __t_b.totalPrice, 10560, hint: "Итог = стоимость проживания + сбор")

Booking.serviceFeePercent = 15
__eq("Ставку подняли до 15% — сбор той же брони стал 1440", __t_b.serviceFee, 1440, hint: "В формуле должна стоять общая ставка Booking.serviceFeePercent, а не число 10")
__eq("Ставку подняли до 15% — итог той же брони стал 11040", __t_b.totalPrice, 11040, hint: "totalPrice должен пользоваться свойством serviceFee, а не считать сбор по своей формуле с числом 10")

Booking.serviceFeePercent = 0
__eq("Ставка 0%: сбор равен 0", __t_b.serviceFee, 0)
__eq("Ставка 0%: итог равен стоимости проживания, 9600", __t_b.totalPrice, 9600)

Booking.serviceFeePercent = 10
let __t_w = Booking.weekend(apartmentTitle: "Лофт на Кремлёвской", pricePerNight: 5600)
__eq("Booking.weekend создаёт бронь на 2 ночи", __t_w.nights, 2)
__eq("Booking.weekend передаёт название жилья", __t_w.apartmentTitle, "Лофт на Кремлёвской", hint: "Название должно браться из параметра apartmentTitle")
__eq("Booking.weekend передаёт цену за ночь", __t_w.pricePerNight, 5600, hint: "Цена должна браться из параметра pricePerNight")
__eq("Выходные в лофте за 5600 при ставке 10%: итого 12320", __t_w.totalPrice, 12320)
```

## @hint1
В структуру нужно добавить четыре вещи. Две из них начинаются со слова `static`, две — обычные вычисляемые свойства, какие ты уже писала.

Ставка — это переменная, которая объявляется внутри структуры как обычно, со значением, только перед `var` стоит `static`. Она одна на все брони.

Сбор — вычисляемое свойство. В формуле участвуют два обычных свойства брони и общая ставка. К ставке внутри свойства обращаются не просто по имени, а через имя типа и точку — так же, как это делает код экрана.

Итог — второе вычисляемое свойство: стоимость проживания плюс сбор. Сбор не пересчитывай, а возьми из свойства, которое только что написала.

Фабричный метод — это `static func` с двумя параметрами, который возвращает `Booking`. Внутри одна строка: создание брони обычным способом, через имя типа и три значения в скобках. Название и цена приходят из параметров, а число ночей известно заранее — это выходные.

## @hint2
Статическое свойство и статический метод объявляются со словом `static`. Внутри обычного вычисляемого свойства к общему значению обращаются через имя типа:

```swift
struct Coupon {
    static var maxPercent = 30

    let code: String
    let percent: Int

    var isAllowed: Bool {
        percent <= Coupon.maxPercent
    }

    static func welcome() -> Coupon {
        Coupon(code: "WELCOME", percent: 10)
    }
}
```

У тебя в формуле сбора будет `Booking.serviceFeePercent`, а у фабричного метода — два параметра, которые он передаёт дальше.

## @hint3
Каркас готов, заполни пропуски:

```swift
    static var serviceFeePercent = 10

    var serviceFee: Int {
        nights * pricePerNight * ___ / 100
    }

    var totalPrice: Int {
        nights * pricePerNight + ___
    }

    ___ func weekend(apartmentTitle: String, pricePerNight: Int) -> Booking {
        Booking(apartmentTitle: apartmentTitle, nights: ___, pricePerNight: pricePerNight)
    }
```

В первом пропуске — общая ставка: имя типа, точка, имя свойства. Во втором — свойство со сбором. В третьем — слово, которое делает метод методом типа. В четвёртом — число ночей в выходных.

Строку `static var serviceFeePercent = 10` поставь в начале структуры, под первым комментарием.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `serviceFeePercent` объявлена со словом `static`, поэтому она одна на весь тип `Booking`. Сколько бы броней ни создали, все они смотрят на одно и то же число. Свойство `serviceFee` каждый раз заглядывает в `Booking.serviceFeePercent`. Поэтому, когда экран записал туда 5, сбор уже созданной брони изменился с 1480 на 740 — саму бронь при этом никто не трогал.

**Почему ставка не обычное свойство.** Если бы `serviceFeePercent` было у каждой брони, его пришлось бы передавать при создании, и у разных броней оно могло бы оказаться разным. А это правило сервиса, а не характеристика брони. Статическое свойство выражает ровно эту мысль: значение одно и относится ко всему типу.

**Почему `totalPrice` берёт `serviceFee`.** Формула сбора записана один раз. `totalPrice` пользуется готовым результатом и автоматически учитывает любую ставку.

**Зачем фабричный метод.** `Booking.weekend(...)` читается как фраза и прячет деталь «выходные — это две ночи» в одном месте. Он статический, потому что вызывается, когда брони ещё нет: экземпляр как раз и появляется в результате вызова.

**Типичные ошибки:**

- `serviceFeePercent` в формуле без `Booking.` — внутри обычного свойства Swift не найдёт такое имя, потому что оно принадлежит типу, а не экземпляру;
- `static let` вместо `static var` — константу нельзя изменить, и строка с акцией на экране не соберётся;
- в формуле осталось число `10` — пока ставка прежняя, всё сходится, но акция на сумму не повлияет;
- `weekend` без `static` — тогда метод можно вызвать только у готовой брони, а её ещё нет;
- `booking.serviceFeePercent` с маленькой буквы — у экземпляра этого свойства нет, оно есть только у типа `Booking`.
