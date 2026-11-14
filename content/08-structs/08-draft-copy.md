---
title: Черновик брони
concept: Семантика значений и вложенные структуры
---

## @description

### Контекст
Гость забронировал дом у озера, а потом решил остаться подольше. Для таких случаев в «Уюте» есть кнопка «Изменить бронь». Она открывает черновик: гость двигает день выезда и сразу видит новую сумму. Пока он не нажал «Сохранить», настоящая бронь должна оставаться прежней — с теми же датами, суммой и промокодом.

Тимлид пишет: «Даты заезда и выезда делаем отдельным типом — они нужны и в брони, и в поиске, и в календаре хозяина. Собери бронь из этого типа и добавь метод, который выдаёт черновик с новым днём выезда. Оригинал при этом трогать нельзя».

### Новое в Swift
**Структура внутри структуры.** Тип свойства может быть любым — в том числе твоей собственной структурой. Так из маленьких типов собирают большие:

```swift
struct GuestCount {
    var adults: Int
    var children: Int
}

struct SearchRequest {
    let city: String
    var guests: GuestCount
}

var request = SearchRequest(city: "Сочи", guests: GuestCount(adults: 2, children: 1))
request.guests.children = 2
print(request.guests.children)    // 2
```

Внутреннюю структуру создают прямо в скобках: `guests: GuestCount(adults: 2, children: 1)`. До вложенного свойства добираются цепочкой точек: `request.guests.children`. Чтобы его изменить, `var` нужен на каждом уровне: у экземпляра `request`, у свойства `guests` и у свойства `children`.

**Структура — это значение.** Вспомни, как ведут себя числа: после `var a = 5`, `var b = a` и `b += 1` в `a` по-прежнему 5. Структуры ведут себя так же. При присваивании, при передаче в функцию и при возврате из неё структура **копируется** целиком, вместе со всеми вложенными структурами. Дальше у копии своя жизнь:

```swift
let saved = SearchRequest(city: "Сочи", guests: GuestCount(adults: 2, children: 0))
var edited = saved
edited.guests.adults = 4

print(saved.guests.adults)     // 2
print(edited.guests.adults)    // 4
```

Это называют **семантикой значений**. Она защищает от сюрпризов: никакой другой код не может незаметно поменять твою переменную.

Тот же приём работает внутри метода. Ты уже знаешь, что `self` — это сам экземпляр. В обычном методе, без `mutating`, менять `self` нельзя. Но можно сделать изменяемую копию, поправить её и вернуть:

```swift
    func withAdults(_ count: Int) -> SearchRequest {
        var copy = self
        copy.guests.adults = count
        return copy
    }
```

Запрос, у которого вызвали метод, остаётся как был, а вызывающий код получает новый.

**Вложенная структура может быть опционалом.** Например, у запроса может быть скидка, а может и не быть: `var discount: Discount?`, где `Discount` — структура со свойством `percent`. Свойство `var` опционального типа при создании можно не указывать — в нём будет `nil`. До свойств внутри опционала добираются знакомой цепочкой `?.`: `request.discount?.percent ?? 0`. Если скидки нет, вся цепочка даёт `nil`, и `??` подставляет ноль.

> 💡 Позже, в модуле про классы, ты встретишь типы, которые при присваивании не копируются. Пока запомни: структура — значение, как число или строка.

### Задача
В редакторе есть готовая структура `PromoCode` (`code` и `percent`) и заготовка структуры `Booking`.

1. Объяви структуру `StayDates` с двумя свойствами типа `Int`, оба через `var`, именно в таком порядке: `checkInDay` — день заезда, `checkOutDay` — день выезда. Добавь в неё вычисляемое свойство `nights` типа `Int`: день выезда минус день заезда.
2. В `Booking` на месте комментария объяви свойство `dates` типа `StayDates` через `var`. Порядок свойств брони получится такой: `apartmentTitle`, `pricePerNight`, `dates`, `promo`.
3. Добавь в `Booking` вычисляемое свойство `totalPrice` типа `Int`: число ночей, умноженное на цену за ночь, минус скидка. Скидка — `percent` процентов от этой суммы. Если промокода нет (`promo` равно `nil`), скидки нет. Суммы в проверках подобраны так, что процент считается без остатка.
4. Добавь в `Booking` метод `draft(checkOutDay:)`. Он принимает новый день выезда (`Int`) и возвращает `Booking` — черновик. Внутри сделай копию самой брони (`var copy = self`), измени в копии день выезда и верни её. Всё остальное, включая промокод, остаётся как в оригинале. Бронь, у которой вызвали метод, меняться не должна, поэтому `mutating` здесь не нужен.

Код экрана под структурами менять не нужно. Сейчас он не собирается: в нём есть `StayDates`, `dates`, `totalPrice` и `draft`, которых пока нет.

### Пример
```swift
let booking = Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, dates: StayDates(checkInDay: 12, checkOutDay: 15), promo: PromoCode(code: "LETO10", percent: 10))
booking.dates.nights          // 3
booking.totalPrice            // 19980: это 22200 минус 10%

let draft = booking.draft(checkOutDay: 17)
draft.dates.nights            // 5
draft.totalPrice              // 33300
booking.dates.checkOutDay     // по-прежнему 15
```

Экран должен вывести:

```text
Бронь: с 12 по 15, ночей: 3, к оплате 19980 руб.
Черновик: с 12 по 17, ночей: 5, к оплате 33300 руб.
Промокод в черновике: LETO10
```

## @starter
```swift
// 1. Объяви структуру StayDates: день заезда, день выезда и число ночей


// Промокод, который гость ввёл при бронировании
struct PromoCode {
    let code: String
    let percent: Int
}

struct Booking {
    let apartmentTitle: String
    let pricePerNight: Int
    // 2. Объяви здесь свойство dates типа StayDates

    var promo: PromoCode?

    // 3. Добавь вычисляемое свойство totalPrice с учётом промокода


    // 4. Добавь метод draft(checkOutDay:): копия брони с другим днём выезда

}

// Экран "Изменить бронь". Этот код уже готов — менять его не нужно
let booking = Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, dates: StayDates(checkInDay: 12, checkOutDay: 15), promo: PromoCode(code: "LETO10", percent: 10))
let draft = booking.draft(checkOutDay: 17)

print("Бронь: с \(booking.dates.checkInDay) по \(booking.dates.checkOutDay), ночей: \(booking.dates.nights), к оплате \(booking.totalPrice) руб.")
print("Черновик: с \(draft.dates.checkInDay) по \(draft.dates.checkOutDay), ночей: \(draft.dates.nights), к оплате \(draft.totalPrice) руб.")
print("Промокод в черновике: \(draft.promo?.code ?? "нет")")
```

## @solution
```swift
// 1. Объяви структуру StayDates: день заезда, день выезда и число ночей
struct StayDates {
    var checkInDay: Int
    var checkOutDay: Int

    var nights: Int {
        checkOutDay - checkInDay
    }
}

// Промокод, который гость ввёл при бронировании
struct PromoCode {
    let code: String
    let percent: Int
}

struct Booking {
    let apartmentTitle: String
    let pricePerNight: Int
    // 2. Объяви здесь свойство dates типа StayDates
    var dates: StayDates
    var promo: PromoCode?

    // 3. Добавь вычисляемое свойство totalPrice с учётом промокода
    var totalPrice: Int {
        let fullPrice = dates.nights * pricePerNight
        let percent = promo?.percent ?? 0
        return fullPrice - fullPrice * percent / 100
    }

    // 4. Добавь метод draft(checkOutDay:): копия брони с другим днём выезда
    func draft(checkOutDay: Int) -> Booking {
        var copy = self
        copy.dates.checkOutDay = checkOutDay
        return copy
    }
}

// Экран "Изменить бронь". Этот код уже готов — менять его не нужно
let booking = Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, dates: StayDates(checkInDay: 12, checkOutDay: 15), promo: PromoCode(code: "LETO10", percent: 10))
let draft = booking.draft(checkOutDay: 17)

print("Бронь: с \(booking.dates.checkInDay) по \(booking.dates.checkOutDay), ночей: \(booking.dates.nights), к оплате \(booking.totalPrice) руб.")
print("Черновик: с \(draft.dates.checkInDay) по \(draft.dates.checkOutDay), ночей: \(draft.dates.nights), к оплате \(draft.totalPrice) руб.")
print("Промокод в черновике: \(draft.promo?.code ?? "нет")")
```

## @output
```
Бронь: с 12 по 15, ночей: 3, к оплате 19980 руб.
Черновик: с 12 по 17, ночей: 5, к оплате 33300 руб.
Промокод в черновике: LETO10
```

## @tests
```swift
let __t_dates = StayDates(checkInDay: 3, checkOutDay: 10)
__eq("StayDates с 3 по 10 число: nights равно 7", __t_dates.nights, 7, hint: "nights — это checkOutDay минус checkInDay")
__eq("StayDates: checkInDay читается", __t_dates.checkInDay, 3)
__eq("StayDates: checkOutDay читается", __t_dates.checkOutDay, 10)

var __t_original = Booking(apartmentTitle: "Студия у набережной", pricePerNight: 3200, dates: StayDates(checkInDay: 3, checkOutDay: 10))
__eq("Без промокода: 7 ночей по 3200 — к оплате 22400", __t_original.totalPrice, 22400, hint: "Если promo равно nil, скидки нет: возьми процент через promo?.percent ?? 0")

let __t_draft = __t_original.draft(checkOutDay: 12)
__eq("Черновик с выездом 12-го: checkOutDay равен 12", __t_draft.dates.checkOutDay, 12, hint: "В копии нужно поменять dates.checkOutDay на параметр метода")
__eq("В черновике день заезда прежний — 3", __t_draft.dates.checkInDay, 3, hint: "Меняется только день выезда, всё остальное копируется из брони")
__eq("В черновике с 3 по 12 число — 9 ночей", __t_draft.dates.nights, 9)
__eq("Черновик: 9 ночей по 3200 — к оплате 28800", __t_draft.totalPrice, 28800)
__eq("В черновике то же жильё", __t_draft.apartmentTitle, "Студия у набережной")
__eq("В черновике та же цена за ночь", __t_draft.pricePerNight, 3200)
__eq("После draft оригинал не изменился: выезд по-прежнему 10-го", __t_original.dates.checkOutDay, 10, hint: "draft должен менять копию, а не саму бронь: var copy = self, затем меняй copy и возвращай её")
__eq("После draft оригинал не изменился: к оплате по-прежнему 22400", __t_original.totalPrice, 22400)

let __t_shorter = __t_original.draft(checkOutDay: 4)
__eq("Черновик короче брони: с 3 по 4 число — одна ночь за 3200", __t_shorter.totalPrice, 3200)
__t_original.promo = PromoCode(code: "VESNA5", percent: 5)
__eq("Брони добавили промокод на 5%: 22400 минус 1120 — к оплате 21280", __t_original.totalPrice, 21280)

var __t_promo = Booking(apartmentTitle: "Лофт на Кремлёвской", pricePerNight: 3200, dates: StayDates(checkInDay: 3, checkOutDay: 10), promo: PromoCode(code: "OSEN15", percent: 15))
__eq("С промокодом на 15%: 22400 минус 3360 — к оплате 19040", __t_promo.totalPrice, 19040, hint: "Скидка — это процент от полной суммы: сумма * percent / 100. Её нужно вычесть из суммы")
let __t_promoDraft = __t_promo.draft(checkOutDay: 5)
__eq("Черновик сохраняет промокод брони", __t_promoDraft.promo?.code ?? "(промокода нет)", "OSEN15", hint: "Черновик — копия всей брони вместе с промокодом. Начни метод со строки var copy = self")
__eq("Черновик с промокодом: 2 ночи по 3200 минус 15% — к оплате 5440", __t_promoDraft.totalPrice, 5440)

var __t_gift = Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, dates: StayDates(checkInDay: 20, checkOutDay: 22), promo: PromoCode(code: "GIFT", percent: 100))
__eq("Промокод на 100%: к оплате 0", __t_gift.totalPrice, 0)
var __t_step = __t_gift.draft(checkOutDay: 25)
__t_step = __t_step.draft(checkOutDay: 21)
__eq("Черновик от черновика: с 20 по 21 число — одна ночь", __t_step.dates.nights, 1)
__eq("После двух черновиков бронь с 20 по 22 число не изменилась", __t_gift.dates.checkOutDay, 22, hint: "draft должен менять копию, а не саму бронь")
__t_gift.promo = nil
__eq("Промокод убрали: 2 ночи по 7400 — к оплате 14800", __t_gift.totalPrice, 14800)

__eq("На экране бронь после создания черновика осталась с выездом 15-го", booking.dates.checkOutDay, 15)
__eq("На экране черновик с выездом 17-го", draft.dates.checkOutDay, 17)
```

## @rules
- mustnot: /mutating\s+func\s+draft\b/ :: Метод `draft(checkOutDay:)` не должен менять саму бронь — убери `mutating` и меняй копию.
- must: /var\s+\w+\s*=\s*self\b/ :: Сделай черновик копированием: начни метод `draft` со строки `var copy = self` и меняй уже копию.

## @hint1
Иди по комментариям в редакторе — их четыре.

Первый шаг — новая структура `StayDates` над `PromoCode`. В ней два свойства через `var` с типом `Int`, в порядке из задания. Ниже — вычисляемое свойство `nights`: после типа сразу фигурные скобки, а в них разность дня выезда и дня заезда.

Второй шаг — одна строка в `Booking` на месте комментария. Свойство `dates`, а его тип — твоя новая структура. Объяви его через `var`: черновику придётся менять даты.

Третий шаг — `totalPrice`. Удобно написать его в три строки. Первая — полная сумма: число ночей лежит внутри `dates`, до него добираются цепочкой точек. Вторая — процент скидки: промокода может не быть, поэтому `percent` достают через `?.`, а на случай `nil` подставляют ноль через `??`. Третья — результат: полная сумма минус её доля. Раз строк несколько, перед результатом нужен `return`.

Четвёртый шаг — метод `draft`, без `mutating`. Он возвращает `Booking`. Внутри заведи переменную и положи в неё `self` — это копия всей брони. Затем через цепочку точек поменяй в копии день выезда на параметр метода. Последней строкой верни копию.

## @hint2
Вот похожий код на других данных: опциональная скидка внутри структуры и метод, который возвращает изменённую копию:

```swift
struct SearchRequest {
    let city: String
    var guests: GuestCount
    var discount: Discount?

    var discountPercent: Int {
        discount?.percent ?? 0
    }

    func withChildren(_ count: Int) -> SearchRequest {
        var copy = self
        copy.guests.children = count
        return copy
    }
}
```

У тебя в `totalPrice` процент скидки получается так же, как `discountPercent`. А `draft(checkOutDay:)` устроен как `withChildren`, только меняется `dates.checkOutDay`.

## @hint3
Структура `StayDates` и свойство `dates` готовы. Заполни пропуски:

```swift
struct StayDates {
    var checkInDay: Int
    var checkOutDay: Int

    var nights: Int {
        checkOutDay - checkInDay
    }
}
```

```swift
    var dates: StayDates
    var promo: PromoCode?

    var totalPrice: Int {
        let fullPrice = dates.___ * pricePerNight
        let percent = promo___percent ?? 0
        return fullPrice - fullPrice * percent / 100
    }

    func draft(checkOutDay: Int) -> Booking {
        var copy = ___
        copy.dates.checkOutDay = checkOutDay
        return ___
    }
```

В первом пропуске — вычисляемое свойство дат с числом ночей. Во втором — два символа, которые читают свойство у опционала. В третьем — слово, которое означает саму бронь. В четвёртом — что метод возвращает.

## @hint4
Вот готовое решение:

{{solution}}

**Как устроена бронь.** У `Booking` теперь есть свойство `dates`, а внутри него — свои свойства и своё вычисляемое `nights`. Поэтому на экране пишут `booking.dates.nights`: сначала берём даты брони, потом у дат — число ночей. Такой тип `StayDates` можно взять в поиск или в календарь хозяина, и расчёт ночей везде будет одинаковым.

**Как работает `totalPrice`.** Цепочка `promo?.percent` читает процент, только если промокод есть. Если `promo` равно `nil`, цепочка тоже даёт `nil`, и `?? 0` превращает его в ноль: скидка нулевая, к оплате полная сумма. Для дома у озера это 3 ночи по 7400, то есть 22200, минус 10% — 19980.

**Почему черновик не задевает бронь.** Строка `var copy = self` копирует бронь целиком: название, цену, даты и промокод. Вложенная `StayDates` тоже копируется, у копии свои даты. Поэтому `copy.dates.checkOutDay = checkOutDay` меняет только копию. Метод возвращает её, а бронь, у которой его вызвали, остаётся прежней. Если гость нажмёт «Отмена», черновик просто выбросят, и ничего не сломается.

**Почему без `mutating`.** Метод не меняет свою бронь — он создаёт новую. `mutating` был бы ложным обещанием: из-за него метод нельзя было бы вызвать у `let booking`, а экран вызывает его именно так.

**Почему `var copy = self`, а не новая бронь вручную.** Можно собрать черновик через `Booking(apartmentTitle: ..., ...)`, перечислив все свойства. Но стоит забыть одно, например `promo`, и черновик молча потеряет промокод. А если завтра в брони появится новое свойство, его придётся не забыть и здесь. Копия `self` переносит всё сразу.

**Типичные ошибки:**

- `mutating func draft` с `dates.checkOutDay = checkOutDay` и `return self` — меняется сама бронь, а не черновик;
- `let copy = self` — константу-копию изменить нельзя, нужна переменная;
- `promo.percent` без вопросительного знака — Swift не даст прочитать свойство у опционала напрямую;
- `let dates` в `Booking` или `let checkOutDay` в `StayDates` — в копии их уже не поменять: `var` нужен на каждом уровне цепочки.
