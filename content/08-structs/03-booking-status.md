---
title: Статус брони
concept: Изменение свойств и mutating-методы
---

## @description

### Контекст
Бронь в «Уюте» живёт своей жизнью. Гость отправил заявку — бронь новая. Пока она новая, менеджер может дать скидку. Потом хозяин жилья подтверждает бронь, и сумма больше не меняется.

В трекере задача: «Добавить в модель `Booking` подтверждение и скидку. Сценарий внизу файла сейчас не собирается — после доработки должен заработать».

### Новое в Swift
До сих пор все свойства у тебя были константами. Но данные брони меняются, поэтому такие свойства объявляют через `var`:

```swift
struct BonusAccount {
    let owner: String
    var points: Int
    var level = "base"
}
```

**Значение по умолчанию.** У `level` значение записано прямо в структуре: каждый новый счёт начинает с уровня `"base"`. При создании такое свойство можно не указывать — `BonusAccount(owner: "Билол", points: 120)`. А если нужно другое значение, его добавляют в скобки как обычно: `level: "gold"`.

**Изменение снаружи.** Свойство `var` меняют присваиванием через точку:

```swift
var account = BonusAccount(owner: "Билол", points: 120)
account.points = 150
```

Есть важное условие: сам экземпляр тоже должен лежать в переменной. Если написать `let account = ...`, Swift не даст изменить ни одно свойство, даже объявленное через `var`. Структура в константе «заморожена» целиком.

**Изменение изнутри.** Менять свойства напрямую из разных мест приложения рискованно: правила вроде «золотой уровень — от 1000 баллов» придётся повторять везде. Надёжнее, когда структура меняет себя сама — методом. Такой метод помечают словом `mutating` («изменяющий»):

```swift
struct BonusAccount {
    let owner: String
    var points: Int
    var level = "base"

    mutating func add(_ amount: Int) {
        points += amount
        if points >= 1000 {
            level = "gold"
        }
    }
}

var account = BonusAccount(owner: "Билол", points: 900)
account.add(150)
print(account.points, account.level)
```

```text
1050 gold
```

Без слова `mutating` Swift не разрешит методу менять свойства. Так сделано нарочно: по объявлению сразу видно, какие методы только читают данные, а какие изменяют экземпляр.

> ⚠️ `mutating`-метод, как и присваивание, можно вызвать только у переменной. У экземпляра, объявленного через `let`, такие методы недоступны.

### Задача
В редакторе есть структура `Booking`: название жилья `apartmentTitle`, сумма к оплате `totalPrice` и статус `status`. Статус хранится кодом, как на сервере; у новой брони это `"new"`.

1. Добавь метод `confirm()`: он меняет `status` на `"confirmed"`.
2. Добавь метод `applyDiscount(percent:)`: он принимает процент скидки (`Int`) и уменьшает `totalPrice` на этот процент. Скидку дают только новой брони: если `status` не равен `"new"`, метод ничего не меняет.
3. Исправь сценарий под структурой, чтобы он собирался. Вызовы методов и `print` в нём не трогай.

Суммы в проверках подобраны так, что процент считается без остатка. Например, 10% от 12000 — это ровно 1200.

### Пример
```swift
var booking = Booking(apartmentTitle: "Лофт на Кремлёвской", totalPrice: 12000)
booking.applyDiscount(percent: 10)   // totalPrice стало 10800
booking.confirm()                    // status стал "confirmed"
booking.applyDiscount(percent: 50)   // ничего не изменилось: бронь уже подтверждена
```

Сценарий должен вывести:

```text
Лофт на Кремлёвской: 10800 руб., статус: confirmed
```

## @starter
```swift
struct Booking {
    let apartmentTitle: String
    var totalPrice: Int
    var status = "new"

    // Добавь сюда методы confirm() и applyDiscount(percent:)

}

// Сценарий из задачи: менеджер даёт скидку 10%, затем хозяин подтверждает бронь
let booking = Booking(apartmentTitle: "Лофт на Кремлёвской", totalPrice: 12000)
booking.applyDiscount(percent: 10)
booking.confirm()
print("\(booking.apartmentTitle): \(booking.totalPrice) руб., статус: \(booking.status)")
```

## @solution
```swift
struct Booking {
    let apartmentTitle: String
    var totalPrice: Int
    var status = "new"

    // Добавь сюда методы confirm() и applyDiscount(percent:)
    mutating func confirm() {
        status = "confirmed"
    }

    mutating func applyDiscount(percent: Int) {
        guard status == "new" else { return }
        totalPrice -= totalPrice * percent / 100
    }
}

// Сценарий из задачи: менеджер даёт скидку 10%, затем хозяин подтверждает бронь
var booking = Booking(apartmentTitle: "Лофт на Кремлёвской", totalPrice: 12000)
booking.applyDiscount(percent: 10)
booking.confirm()
print("\(booking.apartmentTitle): \(booking.totalPrice) руб., статус: \(booking.status)")
```

## @output
```
Лофт на Кремлёвской: 10800 руб., статус: confirmed
```

## @tests
```swift
var __t_b = Booking(apartmentTitle: "Дом у озера", totalPrice: 20000)
__eq("Новая бронь создаётся со статусом new", __t_b.status, "new", hint: "Значение по умолчанию у status менять не нужно: var status = \"new\"")
__t_b.applyDiscount(percent: 25)
__eq("Скидка 25% на бронь за 20000: остаётся 15000", __t_b.totalPrice, 15000, hint: "Из суммы нужно вычесть её часть: totalPrice * percent / 100")
__t_b.applyDiscount(percent: 10)
__eq("Вторая скидка 10% считается от текущей суммы: 15000 становится 13500", __t_b.totalPrice, 13500, hint: "Метод должен менять само свойство totalPrice, чтобы следующая скидка считалась уже от новой суммы")
__t_b.applyDiscount(percent: 0)
__eq("Скидка 0% ничего не меняет", __t_b.totalPrice, 13500)
__eq("Скидка не трогает статус", __t_b.status, "new", hint: "applyDiscount меняет только сумму")
__t_b.confirm()
__eq("После confirm() статус — confirmed", __t_b.status, "confirmed", hint: "Код статуса пишется латиницей, маленькими буквами: confirmed")
__eq("confirm() не трогает сумму", __t_b.totalPrice, 13500)
__t_b.applyDiscount(percent: 50)
__eq("Подтверждённой брони скидка не применяется", __t_b.totalPrice, 13500, hint: "Если status не равен \"new\", applyDiscount должен сразу завершиться и ничего не менять")
__eq("Название жилья осталось прежним", __t_b.apartmentTitle, "Дом у озера")

var __t_cancelled = Booking(apartmentTitle: "Комната в центре", totalPrice: 9000, status: "cancelled")
__t_cancelled.applyDiscount(percent: 10)
__eq("Отменённой брони (status cancelled) скидка тоже не применяется", __t_cancelled.totalPrice, 9000, hint: "Скидка — только для статуса new. Сравнивай статус именно с \"new\", а не с \"confirmed\"")

var __t_gift = Booking(apartmentTitle: "Студия у набережной", totalPrice: 6400)
__t_gift.applyDiscount(percent: 100)
__eq("Скидка 100%: к оплате 0", __t_gift.totalPrice, 0)

__eq("В сценарии после скидки 10% сумма равна 10800", booking.totalPrice, 10800)
__eq("В сценарии бронь подтверждена", booking.status, "confirmed")
```

## @hint1
В задаче две части: методы внутри структуры и одно слово в сценарии.

Оба метода меняют свойства своей брони. Обычному методу Swift это запрещает, поэтому перед словом `func` у каждого должно стоять ещё одно слово — то, что переводится как «изменяющий».

Метод подтверждения совсем короткий: он кладёт в `status` новый код. Ни параметров, ни результата у него нет.

Метод скидки получает процент. Сначала он проверяет, что бронь новая: если статус другой, нужно сразу выйти из метода — ты уже делала такой ранний выход через `guard` в функциях. Затем он уменьшает сумму. Сколько вычесть? Часть суммы: сумма, умноженная на процент и делённая на сто. Результат нужно не вернуть, а записать обратно в `totalPrice` — удобно оператором `-=`.

Теперь сценарий. Посмотри, каким словом объявлена `booking`. Методы, которые меняют экземпляр, можно вызывать только у переменной.

## @hint2
Метод, который меняет свойства, помечают словом `mutating`. А вызывать его можно только у экземпляра, объявленного через `var`:

```swift
struct BonusAccount {
    var points: Int

    mutating func spend(_ amount: Int) {
        guard amount <= points else { return }
        points -= amount
    }
}

var account = BonusAccount(points: 500)
account.spend(200)
```

В твоём `applyDiscount(percent:)` проверка в `guard` другая — про статус, а вычитается не сам параметр, а процент от суммы.

## @hint3
Метод `confirm()` готов. Допиши скидку и поправь объявление в сценарии:

```swift
    mutating func confirm() {
        status = "confirmed"
    }

    ___ func applyDiscount(percent: Int) {
        guard status == ___ else { return }
        totalPrice -= totalPrice * ___ / 100
    }
```

```swift
___ booking = Booking(apartmentTitle: "Лофт на Кремлёвской", totalPrice: 12000)
```

В первом пропуске — слово, которое разрешает методу менять свойства. Во втором — код статуса, при котором скидка разрешена. В третьем — параметр метода. В четвёртом — слово, которым объявляют то, что будет меняться.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `confirm()` записывает в свойство `status` новый код. `applyDiscount(percent:)` сначала проверяет условие через `guard`: если бронь не новая, срабатывает `return`, и метод заканчивается, ничего не изменив. Если новая — из суммы вычитается её доля: `totalPrice * percent / 100`. Для 12000 и 10 это 1200, остаётся 10800.

**Зачем `mutating`.** Структура — это значение, как число или строка. По умолчанию её методы только читают данные. Слово `mutating` — явное разрешение менять экземпляр. Если его забыть, Swift сообщит, что `self` неизменяем. `self` — это сам экземпляр, у которого вызван метод.

**Почему `let booking` не работал.** Константа обещает, что значение не изменится. А для структуры «значение» — это все её свойства сразу. Поэтому у `let`-экземпляра нельзя ни присвоить свойство, ни вызвать `mutating`-метод. Бронь в сценарии меняется дважды, значит, ей нужен `var`.

**Почему проверка статуса внутри метода.** Правило «скидка только для новой брони» записано один раз — в модели. Теперь его невозможно обойти: с какого бы экрана ни вызвали `applyDiscount`, подтверждённая бронь останется при своей сумме.

**Типичные ошибки:**

- метод без `mutating` — код не соберётся;
- `guard status != "confirmed"` — тогда скидку получит и отменённая бронь; надёжнее сравнивать с единственным разрешённым статусом;
- `totalPrice * percent / 100` без записи в свойство — выражение посчитано, но сумма брони не изменилась;
- `totalPrice -= percent` — так вычитаются рубли, а не проценты.
