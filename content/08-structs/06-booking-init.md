---
title: Создание брони
concept: Свой инициализатор init и init?
---

## @description

### Контекст
Форма бронирования передаёт модели четыре значения: название жилья, цену за ночь, день заезда и день выезда. Для простоты считаем, что бронь целиком укладывается в один месяц, поэтому день — это число от 1 до 31.

Тестировщик прислал баг: «Выбрал заезд 15-го, а выезд 12-го. Бронь создалась: ночей минус три, к оплате минус 22200 руб.». Тимлид добавляет: «Бронь с такими датами вообще не должна появляться на свет. Пусть `Booking` при создании сам считает ночи и сумму, а если даты неправильные — не создаётся».

### Новое в Swift
До сих пор экземпляры создавал автоматический инициализатор: в скобках ты перечисляла значения всех свойств. **Инициализатор** — это особый метод, который готовит новый экземпляр. Его можно написать самой — и тогда ты решаешь, какие параметры он принимает и что с ними делает.

```swift
struct Review {
    let author: String
    let stars: Int
    let isPositive: Bool

    init(author: String, stars: Int) {
        self.author = author
        self.stars = stars
        isPositive = stars >= 4
    }
}

let review = Review(author: "Билол", stars: 5)
print(review.isPositive)     // true
```

- Инициализатор объявляют словом `init` — без `func`, без имени и без типа результата.
- Его работа — дать значение **каждому** хранимому свойству. Пропустишь хоть одно — Swift не соберёт код.
- Параметры не обязаны совпадать со свойствами. Здесь `isPositive` снаружи не передают: оно вычисляется один раз, при создании.
- `self` означает «я сам» — экземпляр, который сейчас создаётся. Строка `self.author = author` читается так: в **моё свойство** `author` положи **параметр** `author`. Приставка `self.` нужна, когда имена совпадают. У `isPositive` параметра-тёзки нет, и там можно без неё.

> ⚠️ Как только в структуре появляется свой `init`, автоматический инициализатор исчезает. Написать `Review(author: "Билол", stars: 5, isPositive: false)` уже нельзя. Это хорошо: отзыв с пятью звёздами и пометкой «отрицательный» теперь не создать.

**Инициализатор, который может отказать.** Бывают данные, из которых правильный экземпляр не получится. Тогда после `init` ставят знак вопроса, а при плохих данных пишут `return nil`:

```swift
struct Review {
    let author: String
    let stars: Int

    init?(author: String, stars: Int) {
        guard stars >= 1 && stars <= 5 else {
            return nil
        }
        self.author = author
        self.stars = stars
    }
}
```

Теперь `Review(author: "Билол", stars: 9)` даёт не `Review`, а опционал `Review?`. С ним работают как с любым опционалом — через `if let`, `guard let` или `??`:

```swift
if let review = Review(author: "Билол", stars: 9) {
    print("Отзыв принят: \(review.stars)")
} else {
    print("Оценка должна быть от 1 до 5")
}
```

Такой инициализатор ты уже встречала: `Int("abc")` возвращает `nil`, потому что из этого текста число не получается.

### Задача
В редакторе есть структура `Booking` с пятью свойствами. Напиши для неё инициализатор `init?` с четырьмя параметрами — именно в таком порядке:

`apartmentTitle: String`, `pricePerNight: Int`, `checkInDay: Int`, `checkOutDay: Int`

Инициализатор должен:

1. Вернуть `nil`, если даты неправильные. Даты правильные, когда выполнено всё сразу:
   - день заезда не меньше 1;
   - день выезда не больше 31;
   - выезд строго позже заезда — хотя бы одна ночь.
2. Иначе заполнить все свойства. `apartmentTitle`, `checkInDay` и `checkOutDay` берутся из параметров. `nights` — разница между днём выезда и днём заезда. `totalPrice` — число ночей, умноженное на цену за ночь.

Код экрана оформления под структурой менять не нужно. Сейчас он не собирается: экран создаёт бронь из четырёх значений, а автоматический инициализатор ждёт все пять свойств. Ошибка исчезнет, когда появится твой `init?`.

### Пример
```swift
Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, checkInDay: 12, checkOutDay: 15)
// бронь, у которой nights == 3 и totalPrice == 22200

Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, checkInDay: 15, checkOutDay: 12)
// nil
```

Экран оформления должен вывести:

```text
Бронь создана: Дом у озера, ночей: 3, к оплате 22200 руб.
Проверьте даты заезда и выезда
```

## @starter
```swift
struct Booking {
    let apartmentTitle: String
    let checkInDay: Int
    let checkOutDay: Int
    let nights: Int
    let totalPrice: Int

    // Напиши здесь init? с параметрами apartmentTitle, pricePerNight, checkInDay, checkOutDay

}

// Экран оформления. Этот код уже готов — менять его не нужно
func bookingMessage(checkInDay: Int, checkOutDay: Int) -> String {
    guard let booking = Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, checkInDay: checkInDay, checkOutDay: checkOutDay) else {
        return "Проверьте даты заезда и выезда"
    }
    return "Бронь создана: \(booking.apartmentTitle), ночей: \(booking.nights), к оплате \(booking.totalPrice) руб."
}

print(bookingMessage(checkInDay: 12, checkOutDay: 15))
print(bookingMessage(checkInDay: 15, checkOutDay: 12))
```

## @solution
```swift
struct Booking {
    let apartmentTitle: String
    let checkInDay: Int
    let checkOutDay: Int
    let nights: Int
    let totalPrice: Int

    // Напиши здесь init? с параметрами apartmentTitle, pricePerNight, checkInDay, checkOutDay
    init?(apartmentTitle: String, pricePerNight: Int, checkInDay: Int, checkOutDay: Int) {
        guard checkInDay >= 1 && checkOutDay <= 31 && checkOutDay > checkInDay else {
            return nil
        }
        self.apartmentTitle = apartmentTitle
        self.checkInDay = checkInDay
        self.checkOutDay = checkOutDay
        nights = checkOutDay - checkInDay
        totalPrice = nights * pricePerNight
    }
}

// Экран оформления. Этот код уже готов — менять его не нужно
func bookingMessage(checkInDay: Int, checkOutDay: Int) -> String {
    guard let booking = Booking(apartmentTitle: "Дом у озера", pricePerNight: 7400, checkInDay: checkInDay, checkOutDay: checkOutDay) else {
        return "Проверьте даты заезда и выезда"
    }
    return "Бронь создана: \(booking.apartmentTitle), ночей: \(booking.nights), к оплате \(booking.totalPrice) руб."
}

print(bookingMessage(checkInDay: 12, checkOutDay: 15))
print(bookingMessage(checkInDay: 15, checkOutDay: 12))
```

## @output
```
Бронь создана: Дом у озера, ночей: 3, к оплате 22200 руб.
Проверьте даты заезда и выезда
```

## @tests
```swift
func __t_make(_ checkIn: Int, _ checkOut: Int, price: Int = 3200) -> Booking? {
    Booking(apartmentTitle: "Студия у набережной", pricePerNight: price, checkInDay: checkIn, checkOutDay: checkOut)
}

if let __t_b = __t_make(3, 10) {
    __eq("С 3 по 10 число: nights равно 7", __t_b.nights, 7, hint: "Число ночей — это день выезда минус день заезда")
    __eq("7 ночей по 3200: totalPrice равно 22400", __t_b.totalPrice, 22400, hint: "totalPrice — это nights, умноженное на параметр pricePerNight")
    __eq("checkInDay взят из параметра", __t_b.checkInDay, 3)
    __eq("checkOutDay взят из параметра", __t_b.checkOutDay, 10)
    __eq("apartmentTitle взят из параметра", __t_b.apartmentTitle, "Студия у набережной")
} else {
    __fail("Бронь с 3 по 10 число создаётся", "Даты правильные, но инициализатор вернул nil. Проверь условия")
}

if let __t_b = __t_make(30, 31, price: 5000) {
    __eq("С 30 по 31 число: одна ночь", __t_b.nights, 1)
    __eq("Одна ночь за 5000: totalPrice равно 5000", __t_b.totalPrice, 5000)
} else {
    __fail("Бронь на одну ночь (с 30 по 31) создаётся", "Одна ночь — это уже правильная бронь, а 31 — допустимый день выезда")
}

if let __t_b = __t_make(1, 31, price: 1000) {
    __eq("С 1 по 31 число: 30 ночей", __t_b.nights, 30)
    __eq("30 ночей по 1000: totalPrice равно 30000", __t_b.totalPrice, 30000)
} else {
    __fail("Бронь с 1 по 31 число создаётся", "Дни 1 и 31 допустимы: границы входят в разрешённый диапазон")
}

__ok("Выезд в день заезда (10 и 10) — nil", __t_make(10, 10) == nil, hint: "Нужна хотя бы одна ночь: выезд должен быть строго позже заезда")
__ok("Выезд раньше заезда (15 и 12) — nil", __t_make(15, 12) == nil, hint: "Если день выезда меньше дня заезда, инициализатор должен вернуть nil")
__ok("Заезд в день 0 — nil", __t_make(0, 5) == nil, hint: "День заезда не может быть меньше 1")
__ok("Заезд в день -3 — nil", __t_make(-3, 4) == nil, hint: "День заезда не может быть меньше 1")
__ok("Выезд в день 32 — nil", __t_make(28, 32) == nil, hint: "День выезда не может быть больше 31")
```

## @hint1
Инициализатор пишется внутри структуры, после свойств. Он начинается со слова `init`, сразу за ним — знак вопроса, потом круглые скобки с четырьмя параметрами. Имена и порядок параметров — как в задании. Обрати внимание: параметр `pricePerNight` есть, а свойства с таким именем нет. Это нормально, он нужен только для расчёта.

Внутри сначала проверка дат. Удобно сделать её через `guard`: в условии — всё, что должно быть правдой для правильной брони, а в блоке `else` — выход с `nil`. Условий три, их можно соединить оператором «и» в одном `guard` или написать три `guard` подряд.

После проверки заполни все пять свойств. Три из них получают значения одноимённых параметров. Чтобы Swift отличил свойство от параметра, перед свойством пишут слово «я сам» и точку. Число ночей — разность двух дней. Сумма — произведение числа ночей на цену за ночь.

Ничего возвращать в конце не нужно: если инициализатор дошёл до конца, бронь создана.

## @hint2
Инициализатор со знаком вопроса сначала отсекает плохие данные, а потом заполняет свойства. `self.` отличает свойство от параметра с тем же именем:

```swift
struct Review {
    let author: String
    let stars: Int
    let isPositive: Bool

    init?(author: String, stars: Int) {
        guard stars >= 1 && stars <= 5 else {
            return nil
        }
        self.author = author
        self.stars = stars
        isPositive = stars >= 4
    }
}
```

У тебя параметров четыре, свойств пять, а в условии `guard` три проверки про дни.

## @hint3
Проверка и часть свойств готовы. Заполни пропуски:

```swift
    init?(apartmentTitle: String, pricePerNight: Int, checkInDay: Int, checkOutDay: Int) {
        guard checkInDay >= 1 && checkOutDay <= 31 && checkOutDay > ___ else {
            return ___
        }
        self.apartmentTitle = apartmentTitle
        self.checkInDay = checkInDay
        self.checkOutDay = ___
        nights = checkOutDay - checkInDay
        totalPrice = nights * ___
    }
```

В первом пропуске — с чем сравнивается день выезда. Во втором — что возвращает инициализатор, когда отказывается создавать бронь. В третьем — параметр с днём выезда. В четвёртом — параметр с ценой за ночь.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Экран вызывает `Booking(apartmentTitle: ..., pricePerNight: ..., checkInDay: ..., checkOutDay: ...)`, и Swift запускает твой `init?`. Первым делом `guard` проверяет три условия сразу. Если хотя бы одно нарушено, выполняется `return nil` — экземпляр не создаётся, и экран получает `nil`. Если всё в порядке, пять строк ниже дают значение каждому свойству, и на выходе получается готовая бронь.

**Почему проверка стоит в инициализаторе.** Создание — единственная дверь, через которую бронь попадает в приложение. Если проверка стоит прямо в двери, неправильной брони не существует нигде: ни на экране оплаты, ни в истории, ни в письме гостю. Никому больше не нужно перепроверять даты.

**Почему `nights` и `totalPrice` — не параметры.** Их нельзя доверять тому, кто создаёт бронь: он может ошибиться в арифметике. Инициализатор считает их сам, из дат и цены. Раньше, с автоматическим инициализатором, можно было передать `nights: -3` — теперь такой возможности просто нет.

**Зачем `self.`.** Внутри `init` имя `checkInDay` означает параметр, потому что он «ближе». Запись `checkInDay = checkInDay` присвоила бы параметр самому себе. `self.checkInDay` однозначно указывает на свойство. У `nights` и `totalPrice` одноимённых параметров нет, поэтому там `self.` можно не писать.

**Типичные ошибки:**

- `init` без знака вопроса — тогда `return nil` невозможен, а `guard let` на экране не соберётся;
- `checkOutDay >= checkInDay` — пройдёт бронь на ноль ночей;
- забыто одно из свойств — Swift сообщит, что не все свойства заполнены;
- расчёт стоит до `guard` — при плохих датах он не нужен, сначала проверка;
- перед `init` написано `func` — у инициализатора нет ни `func`, ни типа результата.
