---
title: Чек поездки
concept: Итог модуля — сырые и связанные значения, методы, where, switch
---

## @description

### Контекст
Финальная задача модуля. После поездки пассажир видит чек: тариф и расстояние, цена поездки, скидка по промокоду, чаевые водителю и итог. От дизайнера пришёл макет, а от менеджера продукта — правила для промокодов и чаевых.

Тимлид распределил работу: «Тариф у нас уже есть. Промокоды и чаевые заведены перечислениями, но считать они пока ничего не умеют. Научи их, а потом собери из них чек. Здесь сходится всё, что ты сделала за модуль».

### Что пригодится
Нового в этой задаче нет. Вот инструменты модуля, которые понадобятся:

- **Методы в перечислении.** Метод объявляется внутри фигурных скобок типа. `self` в нём — то значение, у которого метод вызвали. Варианты разбирают через `switch self` без `default`.
- **Связанные значения.** В ветке `switch` данные варианта достают через `let`: `case .address(let street, let house):`. Если данные не нужны, скобки можно не писать.
- **`where`.** Ветка срабатывает, только если выполнено условие на данные: `case .promo(let percent) where percent >= 30:`. Ветку с `where` ставят выше обычной ветки того же варианта.
- **Сырые значения.** `rawValue` даёт код варианта, а `Тип(rawValue: строка)` превращает код обратно в вариант. Результат — опционал: для незнакомого кода получается `nil`. Разворачивай его через `if let`.
- **Строки и массивы.** `uppercased()` переводит текст в заглавные буквы. `append` добавляет строку в конец массива.

Одно напоминание про деление целых чисел. `305 / 10` даёт `30`: дробная часть просто отбрасывается. Скидки и чаевые в процентах считаются именно так.

```swift
let points = 457
print(points / 10)        // 45
print(points * 15 / 100)  // 68
```

### Задача
В редакторе есть готовое перечисление `Tariff` со свойством `title` и методом `price(distanceKm:)`. Есть заготовки перечислений `PromoCode` и `Tip` и функции `receiptLines`.

1. Внутри `PromoCode` напиши метод `discount(for price: Int) -> Int` — скидку в рублях:
   - `welcome` — 150 руб., но не больше цены поездки. Если поездка дешевле 150 руб., скидка равна её цене. Выдели этот случай веткой с `where`;
   - `weekend` — 10% цены: `price / 10`.
2. Внутри `Tip` напиши метод `amount(for price: Int) -> Int` — чаевые в рублях:
   - `none` — `0`;
   - `percent(value:)` — `price * value / 100`;
   - `fixed(amount:)` — сама сумма, от цены она не зависит.
3. Допиши функцию `receiptLines(tariff:distanceKm:promoText:tip:)`. Она возвращает `[String]` — строки чека по порядку:
   - `Тариф: Комфорт, 12 км` — название тарифа и расстояние;
   - `Поездка: 510 руб.` — цена поездки по тарифу;
   - `Промокод WEEKEND: -51 руб.` — только если промокод распознан. Пассажир мог ввести код маленькими буквами, поэтому переведи `promoText` в заглавные и только потом ищи вариант. В строке пиши код из `rawValue`. Незнакомый код и пустая строка не дают ни строки, ни скидки;
   - `Чаевые: 102 руб.` — только если чаевые больше нуля. Считай их от цены поездки без скидки: промокод оплачивает сервис, а не водитель;
   - `Итого: 561 руб.` — цена поездки минус скидка плюс чаевые.

Варианты перечислений не меняй. В `switch` не используй `default`.

### Пример
```swift
PromoCode.welcome.discount(for: 510)      // 150
PromoCode.welcome.discount(for: 100)      // 100
PromoCode.weekend.discount(for: 305)      // 30
Tip.percent(value: 15).amount(for: 510)   // 76
Tip.fixed(amount: 200).amount(for: 510)   // 200

receiptLines(tariff: .economy, distanceKm: 10, promoText: "", tip: .none)
// ["Тариф: Эконом, 10 км", "Поездка: 300 руб.", "Итого: 300 руб."]
```

Проба в конце кода напечатает:

```text
Тариф: Комфорт, 12 км
Поездка: 510 руб.
Промокод WEEKEND: -51 руб.
Чаевые: 102 руб.
Итого: 561 руб.
```

## @starter
```swift
// Тариф поездки. Уже готов
enum Tariff {
    case economy
    case comfort
    case business
    case kids

    var title: String {
        switch self {
        case .economy: return "Эконом"
        case .comfort: return "Комфорт"
        case .business: return "Бизнес"
        case .kids: return "Детский"
        }
    }

    var baseFare: Int {
        switch self {
        case .economy: return 100
        case .comfort: return 150
        case .business: return 300
        case .kids: return 200
        }
    }

    var pricePerKm: Int {
        switch self {
        case .economy: return 20
        case .comfort: return 30
        case .business: return 50
        case .kids: return 35
        }
    }

    func price(distanceKm: Int) -> Int {
        baseFare + pricePerKm * distanceKm
    }
}

// Промокоды. На сервере коды хранятся заглавными буквами
enum PromoCode: String {
    case welcome = "WELCOME"   // минус 150 руб., но не больше цены поездки
    case weekend = "WEEKEND"   // минус 10% цены поездки

    // 1. Метод discount(for:) - скидка в рублях для поездки с ценой price

}

// Чаевые, которые пассажир выбрал после поездки
enum Tip {
    case none
    case percent(value: Int)
    case fixed(amount: Int)

    // 2. Метод amount(for:) - чаевые в рублях для поездки с ценой price

}

// 3. Строки чека: тариф, поездка, промокод (если распознан), чаевые (если есть), итог
func receiptLines(tariff: Tariff, distanceKm: Int, promoText: String, tip: Tip) -> [String] {
    // Замени заглушку: посчитай цену, скидку и чаевые и собери строки
    return []
}

// Проба: чек после поездки на Комфорте с промокодом и чаевыми 20%
let receipt = receiptLines(tariff: .comfort, distanceKm: 12, promoText: "weekend", tip: .percent(value: 20))
for line in receipt {
    print(line)
}
```

## @solution
```swift
// Тариф поездки. Уже готов
enum Tariff {
    case economy
    case comfort
    case business
    case kids

    var title: String {
        switch self {
        case .economy: return "Эконом"
        case .comfort: return "Комфорт"
        case .business: return "Бизнес"
        case .kids: return "Детский"
        }
    }

    var baseFare: Int {
        switch self {
        case .economy: return 100
        case .comfort: return 150
        case .business: return 300
        case .kids: return 200
        }
    }

    var pricePerKm: Int {
        switch self {
        case .economy: return 20
        case .comfort: return 30
        case .business: return 50
        case .kids: return 35
        }
    }

    func price(distanceKm: Int) -> Int {
        baseFare + pricePerKm * distanceKm
    }
}

// Промокоды. На сервере коды хранятся заглавными буквами
enum PromoCode: String {
    case welcome = "WELCOME"   // минус 150 руб., но не больше цены поездки
    case weekend = "WEEKEND"   // минус 10% цены поездки

    // 1. Метод discount(for:) - скидка в рублях для поездки с ценой price
    func discount(for price: Int) -> Int {
        switch self {
        case .welcome where price < 150:
            return price
        case .welcome:
            return 150
        case .weekend:
            return price / 10
        }
    }
}

// Чаевые, которые пассажир выбрал после поездки
enum Tip {
    case none
    case percent(value: Int)
    case fixed(amount: Int)

    // 2. Метод amount(for:) - чаевые в рублях для поездки с ценой price
    func amount(for price: Int) -> Int {
        switch self {
        case .none:
            return 0
        case .percent(let value):
            return price * value / 100
        case .fixed(let amount):
            return amount
        }
    }
}

// 3. Строки чека: тариф, поездка, промокод (если распознан), чаевые (если есть), итог
func receiptLines(tariff: Tariff, distanceKm: Int, promoText: String, tip: Tip) -> [String] {
    let price = tariff.price(distanceKm: distanceKm)
    var lines = ["Тариф: \(tariff.title), \(distanceKm) км", "Поездка: \(price) руб."]
    var total = price

    if let promo = PromoCode(rawValue: promoText.uppercased()) {
        let discount = promo.discount(for: price)
        lines.append("Промокод \(promo.rawValue): -\(discount) руб.")
        total -= discount
    }

    let tipAmount = tip.amount(for: price)
    if tipAmount > 0 {
        lines.append("Чаевые: \(tipAmount) руб.")
        total += tipAmount
    }

    lines.append("Итого: \(total) руб.")
    return lines
}

// Проба: чек после поездки на Комфорте с промокодом и чаевыми 20%
let receipt = receiptLines(tariff: .comfort, distanceKm: 12, promoText: "weekend", tip: .percent(value: 20))
for line in receipt {
    print(line)
}
```

## @tests
```swift
__eq("WELCOME для поездки за 510 руб.: скидка 150 руб.", PromoCode.welcome.discount(for: 510), 150, hint: "Код WELCOME даёт 150 руб. скидки, если поездка стоит 150 руб. или больше")
__eq("WELCOME для поездки ровно за 150 руб.: скидка 150 руб.", PromoCode.welcome.discount(for: 150), 150, hint: "Поездка ровно за 150 руб. получает полную скидку 150 руб. Условие в where - цена меньше 150, а не меньше или равна")
__eq("WELCOME для поездки за 149 руб.: скидка равна цене", PromoCode.welcome.discount(for: 149), 149, hint: "Скидка не может быть больше цены поездки: если цена меньше 150, верни саму цену. Ветка с where должна стоять выше обычной ветки .welcome")
__eq("WELCOME для поездки за 100 руб.: поездка бесплатная", PromoCode.welcome.discount(for: 100), 100, hint: "Скидка не может быть больше цены поездки: если цена меньше 150, верни саму цену")
__eq("WEEKEND для поездки за 510 руб.: скидка 51 руб.", PromoCode.weekend.discount(for: 510), 51, hint: "Код WEEKEND даёт 10% цены: price / 10")
__eq("WEEKEND для поездки за 305 руб.: дробная часть отбрасывается", PromoCode.weekend.discount(for: 305), 30, hint: "price / 10 для целых чисел отбрасывает дробную часть: 305 / 10 = 30")
__eq("WEEKEND для поездки за 1550 руб.: скидка 155 руб.", PromoCode.weekend.discount(for: 1550), 155, hint: "Скидка по WEEKEND зависит от цены: price / 10")

__eq("Без чаевых: 0 руб.", Tip.none.amount(for: 510), 0, hint: "Для варианта .none чаевые равны нулю")
__eq("Чаевые 10% от 510 руб.: 51 руб.", Tip.percent(value: 10).amount(for: 510), 51, hint: "Процент достань из данных варианта: case .percent(let value). Чаевые: price * value / 100")
__eq("Чаевые 15% от 510 руб.: 76 руб.", Tip.percent(value: 15).amount(for: 510), 76, hint: "Чаевые: price * value / 100. Сначала умножай, потом дели - иначе 15 / 100 даст ноль")
__eq("Чаевые 0%: 0 руб.", Tip.percent(value: 0).amount(for: 510), 0)
__eq("Фиксированные чаевые 200 руб.", Tip.fixed(amount: 200).amount(for: 510), 200, hint: "Для .fixed верни сумму из данных варианта: case .fixed(let amount)")
__eq("Фиксированные чаевые не зависят от цены поездки", Tip.fixed(amount: 50).amount(for: 100), 50, hint: "Для .fixed верни сумму из данных варианта, цена поездки здесь не нужна")

__eq("Чек: Комфорт, 12 км, код weekend, чаевые 20%", receiptLines(tariff: .comfort, distanceKm: 12, promoText: "weekend", tip: .percent(value: 20)), ["Тариф: Комфорт, 12 км", "Поездка: 510 руб.", "Промокод WEEKEND: -51 руб.", "Чаевые: 102 руб.", "Итого: 561 руб."], hint: "Сверь строки по одной. Код в чеке - из rawValue, заглавными. Чаевые считаются от цены без скидки: 20% от 510 руб.")
__eq("Чек: Эконом, 10 км, без промокода и чаевых - три строки", receiptLines(tariff: .economy, distanceKm: 10, promoText: "", tip: .none), ["Тариф: Эконом, 10 км", "Поездка: 300 руб.", "Итого: 300 руб."], hint: "Пустой промокод не даёт строки, нулевые чаевые - тоже. Остаются тариф, поездка и итог")
__eq("Чек: Бизнес, 5 км, незнакомый код SPRING, чаевые 200 руб.", receiptLines(tariff: .business, distanceKm: 5, promoText: "SPRING", tip: .fixed(amount: 200)), ["Тариф: Бизнес, 5 км", "Поездка: 550 руб.", "Чаевые: 200 руб.", "Итого: 750 руб."], hint: "Для незнакомого кода PromoCode(rawValue:) возвращает nil: ни строки, ни скидки")
__eq("Чек: Эконом, 0 км, код Welcome, чаевые 10% - поездка бесплатная", receiptLines(tariff: .economy, distanceKm: 0, promoText: "Welcome", tip: .percent(value: 10)), ["Тариф: Эконом, 0 км", "Поездка: 100 руб.", "Промокод WELCOME: -100 руб.", "Чаевые: 10 руб.", "Итого: 10 руб."], hint: "Код, введённый как Welcome, нужно перевести в заглавные перед поиском. Скидка не больше цены поездки, а чаевые считаются от цены без скидки")
__eq("Чек: Детский, 3 км, код WEEKEND, чаевые 0%", receiptLines(tariff: .kids, distanceKm: 3, promoText: "WEEKEND", tip: .percent(value: 0)), ["Тариф: Детский, 3 км", "Поездка: 305 руб.", "Промокод WEEKEND: -30 руб.", "Итого: 275 руб."], hint: "Если чаевые получились нулевыми, строки с чаевыми нет")
__eq("Чек: Комфорт, 2 км, код welcome, без чаевых", receiptLines(tariff: .comfort, distanceKm: 2, promoText: "welcome", tip: .none), ["Тариф: Комфорт, 2 км", "Поездка: 210 руб.", "Промокод WELCOME: -150 руб.", "Итого: 60 руб."], hint: "Итог: цена поездки минус скидка плюс чаевые")
```

## @rules
- must: /\bPromoCode\s*\(\s*rawValue\s*:/ :: Промокод из текста распознавай готовым инициализатором: `PromoCode(rawValue: ...)`.
- must: /\bfunc\s+discount\s*\(\s*for\s+price\s*:\s*Int\s*\)\s*->\s*Int/ :: Скидку посчитай методом внутри `PromoCode`: `func discount(for price: Int) -> Int`.
- must: /\bfunc\s+amount\s*\(\s*for\s+price\s*:\s*Int\s*\)\s*->\s*Int/ :: Чаевые посчитай методом внутри `Tip`: `func amount(for price: Int) -> Int`.
- mustnot: /\bdefault\s*:/ :: В `switch` по перечислению перечисли все варианты без `default` — так Swift напомнит о новом промокоде или виде чаевых.

## @hint1
Иди по комментариям с номерами.

Шаг первый — `discount(for:)` внутри `PromoCode`. Объяви метод словом `func`, параметр с меткой `for` и именем `price`, результат `Int`. Внутри — `switch self`. Для `welcome` понадобятся две ветки. Первая — с `where` и условием «цена меньше 150»: она возвращает саму цену. Вторая — обычная ветка `welcome`: она возвращает 150. Ветку с `where` поставь выше. Для `weekend` верни десятую часть цены.

Шаг второй — `amount(for:)` внутри `Tip`. Устроен так же: `switch self` и три ветки. В ветках `percent` и `fixed` достань данные варианта через `let`. Процент превращается в рубли так: цену умножить на процент и разделить на сто.

Шаг третий — функция чека. Посчитай цену поездки методом тарифа. Заведи массив-переменную с первыми двумя строками и переменную для итога, равную цене. Потом попробуй распознать промокод: переведи текст в заглавные буквы и передай в `PromoCode(rawValue:)`. Если вариант нашёлся — внутри `if let` посчитай скидку, добавь строку и вычти скидку из итога. Затем посчитай чаевые от цены. Если они больше нуля — добавь строку и прибавь их к итогу. В конце добавь строку с итогом и верни массив.

## @hint2
Два самых важных места. Ветка с `where` и данные варианта в `switch self`:

```swift
enum Bonus {
    case birthday
    case referral(friends: Int)

    func points(for price: Int) -> Int {
        switch self {
        case .birthday where price < 500:
            return 50
        case .birthday:
            return 100
        case .referral(let friends):
            return friends * 30
        }
    }
}
```

И распознавание кода, введённого как попало:

```swift
enum Airport: String {
    case sheremetyevo = "SVO"
    case vnukovo = "VKO"
}

let typed = "vko"
if let airport = Airport(rawValue: typed.uppercased()) {
    print("Аэропорт: \(airport.rawValue)")   // Аэропорт: VKO
}
```

`uppercased()` срабатывает раньше, чем инициализатор ищет вариант.

## @hint3
Оба метода почти готовы, в функции чека остались пропуски:

```swift
    func discount(for price: Int) -> Int {
        switch self {
        case .welcome where ___:
            return price
        case .welcome:
            return 150
        case .weekend:
            return price / 10
        }
    }

    func amount(for price: Int) -> Int {
        switch self {
        case .none:
            return 0
        case .percent(let value):
            return ___
        case .fixed(let amount):
            return amount
        }
    }

func receiptLines(tariff: Tariff, distanceKm: Int, promoText: String, tip: Tip) -> [String] {
    let price = tariff.price(distanceKm: distanceKm)
    var lines = ["Тариф: \(tariff.title), \(distanceKm) км", "Поездка: \(price) руб."]
    var total = price

    if let promo = PromoCode(rawValue: ___) {
        let discount = promo.discount(for: price)
        lines.append("Промокод \(promo.rawValue): -\(discount) руб.")
        total -= discount
    }

    let tipAmount = tip.amount(for: ___)
    if tipAmount > 0 {
        lines.append("Чаевые: \(tipAmount) руб.")
        total += tipAmount
    }

    lines.append(___)
    return lines
}
```

По порядку: условие «поездка дешевле 150 руб.»; формула чаевых в процентах; текст промокода в заглавных буквах; цена, от которой считаются чаевые; строка с итогом.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Каждое перечисление считает своё. `PromoCode` знает, сколько стоит каждый код. `Tip` знает, как превратить выбор пассажира в рубли. Функция чека ничего не знает о правилах: она спрашивает у тарифа цену, у промокода скидку, у чаевых сумму и складывает строки.

В `discount(for:)` Swift проверяет ветки сверху вниз. Для `welcome` и цены 100 подходит первая ветка — с `where`, и скидка равна цене. Для цены 510 условие не выполнено, Swift идёт дальше и попадает в обычную ветку `welcome`.

В `amount(for:)` данные варианта достаются через `let`: у `.percent(value: 20)` в константе `value` окажется 20. Формула `price * value / 100` сначала умножает, потом делит. Если поставить скобки `price * (value / 100)`, получится ноль: `20 / 100` у целых чисел равно нулю.

В функции чека `PromoCode(rawValue: promoText.uppercased())` превращает «weekend», «Weekend» и «WEEKEND» в один и тот же вариант. Незнакомый код и пустая строка дают `nil`, и блок `if let` просто пропускается. В строку чека идёт `promo.rawValue`, поэтому код всегда напечатан так, как его хранит сервер.

**Почему чаевые от `price`, а не от `total`.** Промокод — подарок сервиса пассажиру. Водитель не должен получить меньше чаевых из-за того, что пассажир ввёл код. Поэтому процент берётся от полной цены поездки.

**Почему скидку ограничивает `where`, а не проверка в чеке.** Правило «не больше цены поездки» относится к самому промокоду. Если завтра появится второй экран, где показывают скидку, он получит правильное число без повторной проверки.

**Типичные ошибки:**

- обычная ветка `.welcome` стоит выше ветки с `where` — до неё очередь не доходит, и поездка за 100 руб. получает скидку 150 руб., а итог уходит в минус;
- в строку чека вставлен `promoText` вместо `promo.rawValue` — пассажир видит код так, как набрал его сам: `Welcome`;
- чаевые посчитаны от `total` после вычета скидки — водитель получает меньше положенного;
- строка с чаевыми добавляется всегда — при `.none` в чеке появляется `Чаевые: 0 руб.`
