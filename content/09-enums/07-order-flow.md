---
title: Путь заказа
concept: Перечисление как конечный автомат — mutating-методы и self = .вариант
---

## @description

### Контекст
Служба поддержки переслала жалобу. Пассажирка отменила заказ и уехала на автобусе. Через секунду с сервера пришло опоздавшее событие «водитель выехал», и на экране снова появилось «Водитель едет к вам». Водитель действительно приехал — к пустой остановке.

Вторая жалоба похожа на первую. Пассажир нажал «Отменить» прямо во время поездки, и приложение послушно перевело её в «Заказ отменён». А ведь машина уже ехала.

Тимлид открыл код и нашёл причину: статус заказа меняют простым присваиванием из десятка мест — `status = .driverOnTheWay`. Никто не проверяет, можно ли так сделать. «Давай сделаем из `OrderStatus` конечный автомат. Пусть статус сам знает, куда ему можно перейти, а куда нельзя».

### Новое в Swift
**Конечный автомат** (по-английски state machine) — это модель с двумя частями. Первая — короткий список состояний. Вторая — правила, из какого состояния в какое можно перейти. Всё, чего нет в правилах, запрещено.

Возьмём смену водителя. Состояний три: не на линии, на линии, на перерыве. Правила такие:

- на перерыв можно уйти только с линии;
- с перерыва водитель возвращается на линию;
- уйти домой можно только с линии, не посреди перерыва.

Список состояний — это перечисление, его ты уже умеешь писать. А правила — методы, которые меняют само значение.

**`mutating` в перечислении.** Слово `mutating` ты знаешь по структурам: так помечают метод, который меняет экземпляр. У структуры такой метод меняет свойства. У перечисления свойств нет, поэтому метод заменяет значение целиком. Для этого он присваивает новый вариант слову `self`:

```swift
enum ShiftStatus {
    case offline
    case online
    case onBreak

    mutating func startBreak() {
        if self == .online {
            self = .onBreak
        }
    }
}
```

Запись `self = .onBreak` значит: «теперь это значение — перерыв». Проверка `self == .online` стоит перед присваиванием и пропускает только разрешённый переход. Если водитель не на линии, метод ничего не меняет.

Правил может быть больше, и тогда удобнее `switch self`. В нём есть одна тонкость. Пустую ветку Swift не пропустит: в каждой должна быть хотя бы одна команда. Если делать ничего не нужно, пишут `break` — то же слово, что выходит из цикла. В `switch` оно значит «ничего не делать».

```swift
    mutating func endBreak() {
        switch self {
        case .onBreak:
            self = .online
        case .offline, .online:
            break
        }
    }
```

Метод может и сообщить, получился ли переход. Тогда он возвращает `Bool`:

```swift
    mutating func goOffline() -> Bool {
        guard self == .online else {
            return false
        }
        self = .offline
        return true
    }
```

Экран узнаёт ответ и решает, что показать водителю: «Смена закрыта» или «Сначала закончи перерыв».

Вызов выглядит как у структуры:

```swift
var shift = ShiftStatus.online
shift.startBreak()       // теперь .onBreak
shift.startBreak()       // ничего не изменилось: перерыв уже идёт
print(shift.goOffline()) // false: посреди перерыва уйти нельзя
shift.endBreak()         // снова .online
```

> ⚠️ Как и у структур, `mutating`-метод можно вызвать только у переменной. Если написать `let shift = ShiftStatus.online`, Swift не даст вызвать `shift.startBreak()`.

### Задача
В редакторе есть перечисление `OrderStatus` с пятью состояниями заказа и готовым свойством `title`. Путь заказа такой: `searching` (ищем машину), затем `driverOnTheWay` (водитель едет к пассажиру), затем `inProgress` (поездка идёт), затем `completed` (поездка завершена). Ещё есть `cancelled` — заказ отменён.

Допиши внутри перечисления:

1. Вычисляемое свойство `canCancel` типа `Bool`. Оно равно `true` для `searching` и `driverOnTheWay`. Для остальных трёх состояний — `false`.
2. Метод `mutating func advance()`. Он переводит заказ на один шаг вперёд по пути: из `searching` в `driverOnTheWay`, из `driverOnTheWay` в `inProgress`, из `inProgress` в `completed`. У `completed` и `cancelled` метод ничего не меняет: дальше идти некуда.
3. Метод `mutating func cancel() -> Bool`. Если заказ можно отменить (смотри `canCancel`), метод переводит его в `cancelled` и возвращает `true`. Если нельзя — состояние не меняется, метод возвращает `false`.

В `switch` по состояниям не используй `default`.

### Пример
```swift
var order = OrderStatus.searching
order.advance()        // теперь .driverOnTheWay
order.canCancel        // true
order.cancel()         // true, теперь .cancelled
order.advance()        // ничего не изменилось: .cancelled
order.cancel()         // false: заказ уже отменён
```

Проба в конце кода напечатает:

```text
Поездка идёт: отменить уже нельзя
Поездка завершена
Заказ отменён
Заказ отменён
```

## @starter
```swift
// Состояние заказа такси
enum OrderStatus {
    case searching
    case driverOnTheWay
    case inProgress
    case completed
    case cancelled

    // Текст для экрана заказа. Это свойство уже готово
    var title: String {
        switch self {
        case .searching: return "Ищем машину"
        case .driverOnTheWay: return "Водитель едет к вам"
        case .inProgress: return "Поездка идёт"
        case .completed: return "Поездка завершена"
        case .cancelled: return "Заказ отменён"
        }
    }

    // 1. Вычисляемое свойство canCancel: true для searching и driverOnTheWay


    // 2. Метод advance(): один шаг вперёд по пути заказа.
    //    У completed и cancelled ничего не меняется


    // 3. Метод cancel() -> Bool: отменить, если можно, и сообщить, получилось ли

}

// Проба 1: поездка прошла от начала до конца
var ride = OrderStatus.searching
ride.advance()
ride.advance()
if !ride.cancel() {
    print("\(ride.title): отменить уже нельзя")
}
ride.advance()
print(ride.title)

// Проба 2: пассажир отменил заказ, а потом пришло опоздавшее событие от сервера
var lateRide = OrderStatus.searching
if lateRide.cancel() {
    print(lateRide.title)
}
lateRide.advance()
print(lateRide.title)
```

## @solution
```swift
// Состояние заказа такси
enum OrderStatus {
    case searching
    case driverOnTheWay
    case inProgress
    case completed
    case cancelled

    // Текст для экрана заказа. Это свойство уже готово
    var title: String {
        switch self {
        case .searching: return "Ищем машину"
        case .driverOnTheWay: return "Водитель едет к вам"
        case .inProgress: return "Поездка идёт"
        case .completed: return "Поездка завершена"
        case .cancelled: return "Заказ отменён"
        }
    }

    // 1. Вычисляемое свойство canCancel: true для searching и driverOnTheWay
    var canCancel: Bool {
        switch self {
        case .searching, .driverOnTheWay:
            return true
        case .inProgress, .completed, .cancelled:
            return false
        }
    }

    // 2. Метод advance(): один шаг вперёд по пути заказа.
    //    У completed и cancelled ничего не меняется
    mutating func advance() {
        switch self {
        case .searching:
            self = .driverOnTheWay
        case .driverOnTheWay:
            self = .inProgress
        case .inProgress:
            self = .completed
        case .completed, .cancelled:
            break
        }
    }

    // 3. Метод cancel() -> Bool: отменить, если можно, и сообщить, получилось ли
    mutating func cancel() -> Bool {
        guard canCancel else {
            return false
        }
        self = .cancelled
        return true
    }
}

// Проба 1: поездка прошла от начала до конца
var ride = OrderStatus.searching
ride.advance()
ride.advance()
if !ride.cancel() {
    print("\(ride.title): отменить уже нельзя")
}
ride.advance()
print(ride.title)

// Проба 2: пассажир отменил заказ, а потом пришло опоздавшее событие от сервера
var lateRide = OrderStatus.searching
if lateRide.cancel() {
    print(lateRide.title)
}
lateRide.advance()
print(lateRide.title)
```

## @tests
```swift
func __t_advanced(_ start: OrderStatus, steps: Int = 1) -> OrderStatus {
    var status = start
    for _ in 0..<steps {
        status.advance()
    }
    return status
}
func __t_cancelResult(_ start: OrderStatus) -> Bool {
    var status = start
    return status.cancel()
}
func __t_afterCancel(_ start: OrderStatus) -> OrderStatus {
    var status = start
    _ = status.cancel()
    return status
}

__eq("Готовое свойство title осталось на месте", OrderStatus.driverOnTheWay.title, "Водитель едет к вам", hint: "Свойство title менять не нужно")

__eq("canCancel: пока ищем машину, отменить можно", OrderStatus.searching.canCancel, true, hint: "Для .searching свойство canCancel должно быть true")
__eq("canCancel: водитель едет к пассажиру, отменить можно", OrderStatus.driverOnTheWay.canCancel, true, hint: "Для .driverOnTheWay свойство canCancel должно быть true")
__eq("canCancel: поездка идёт, отменить нельзя", OrderStatus.inProgress.canCancel, false, hint: "Во время поездки отменить заказ нельзя: для .inProgress верни false")
__eq("canCancel: поездка завершена, отменить нельзя", OrderStatus.completed.canCancel, false, hint: "Завершённую поездку отменить нельзя: для .completed верни false")
__eq("canCancel: заказ уже отменён, второй раз нельзя", OrderStatus.cancelled.canCancel, false, hint: "Отменённый заказ второй раз не отменяют: для .cancelled верни false")

__eq("advance: из поиска - к водителю в пути", __t_advanced(.searching), .driverOnTheWay, hint: "Один вызов advance() - ровно один шаг. Если заказ перескочил дальше, проверь, не идут ли проверки подряд отдельными if: после первого присваивания срабатывает следующая")
__eq("advance: от водителя в пути - к поездке", __t_advanced(.driverOnTheWay), .inProgress, hint: "Из .driverOnTheWay заказ переходит в .inProgress")
__eq("advance: из поездки - к завершению", __t_advanced(.inProgress), .completed, hint: "Из .inProgress заказ переходит в .completed")
__eq("advance: завершённая поездка остаётся завершённой", __t_advanced(.completed), .completed, hint: "У .completed метод advance() ничего не меняет")
__eq("advance: опоздавшее событие не воскрешает отменённый заказ", __t_advanced(.cancelled), .cancelled, hint: "У .cancelled метод advance() ничего не меняет - именно эту ошибку и нашла поддержка")
__eq("advance два раза из поиска - поездка идёт", __t_advanced(.searching, steps: 2), .inProgress, hint: "Каждый вызов advance() - один шаг: searching, driverOnTheWay, inProgress")
__eq("advance пять раз из поиска - поездка завершена и дальше не идёт", __t_advanced(.searching, steps: 5), .completed, hint: "После .completed заказ никуда не переходит, сколько бы раз ни вызвали advance()")

__eq("cancel во время поиска: получилось", __t_cancelResult(.searching), true, hint: "Пока ищем машину, отмена разрешена: метод возвращает true")
__eq("cancel во время поиска: заказ отменён", __t_afterCancel(.searching), .cancelled, hint: "Если отмена разрешена, присвой self = .cancelled")
__eq("cancel, когда водитель в пути: получилось", __t_cancelResult(.driverOnTheWay), true, hint: "Пока водитель едет к пассажиру, отмена разрешена: метод возвращает true")
__eq("cancel, когда водитель в пути: заказ отменён", __t_afterCancel(.driverOnTheWay), .cancelled, hint: "Если отмена разрешена, присвой self = .cancelled")
__eq("cancel во время поездки: не получилось", __t_cancelResult(.inProgress), false, hint: "Во время поездки отменить нельзя: метод возвращает false")
__eq("cancel во время поездки: поездка продолжается", __t_afterCancel(.inProgress), .inProgress, hint: "Если отмена запрещена, состояние не должно меняться. Проверь canCancel до присваивания, а не после")
__eq("cancel после завершения: не получилось", __t_cancelResult(.completed), false, hint: "Завершённую поездку отменить нельзя: метод возвращает false")
__eq("cancel после завершения: поездка остаётся завершённой", __t_afterCancel(.completed), .completed, hint: "Если отмена запрещена, состояние не должно меняться")
__eq("Повторная отмена: не получилось", __t_cancelResult(.cancelled), false, hint: "Заказ уже отменён, второй раз отменить его нельзя: метод возвращает false. Возьми ответ из canCancel")
__eq("Повторная отмена: заказ остаётся отменённым", __t_afterCancel(.cancelled), .cancelled)
```

## @rules
- must: /\bmutating\s+func\s+advance\s*\(\s*\)/ :: Объяви `advance()` как изменяющий метод: `mutating func advance() { ... }`.
- must: /\bmutating\s+func\s+cancel\s*\(\s*\)\s*->\s*Bool\b/ :: Объяви `cancel()` как изменяющий метод, который возвращает `Bool`: `mutating func cancel() -> Bool { ... }`.
- must: /\bself\s*=\s*\./ :: Внутри методов меняй само значение: присвой `self` новый вариант, например `self = .cancelled`.
- mustnot: /\bdefault\s*:/ :: В `switch` по состояниям перечисли все варианты без `default` — тогда Swift напомнит о каждом новом состоянии заказа.

## @hint1
Весь новый код пишется внутри фигурных скобок `OrderStatus`, на месте комментариев с номерами.

Начни со свойства `canCancel`. Оно устроено как готовое `title`: `var`, имя, двоеточие, тип `Bool` и `switch self`. Два состояния, в которых отмена разрешена, можно перечислить в одной ветке через запятую. Остальные три — во второй ветке.

Метод `advance()` помечается словом `mutating`, потому что меняет значение. Внутри — `switch self`. В каждой ветке, где есть следующий шаг, присвой `self` следующее состояние. Для `completed` и `cancelled` шага нет: объедини их в одну ветку и напиши в ней `break`.

Метод `cancel()` тоже `mutating`, а после скобок у него стрелка и `Bool`. Здесь пригодится готовое свойство `canCancel`: начни с `guard`. Если отменить нельзя, сразу верни `false`. Ниже `guard` присвой `self` вариант `cancelled` и верни `true`.

Пока методов нет, проба внизу не собирается: Swift пишет, что у `OrderStatus` нет `advance`. Когда допишешь методы, ошибка исчезнет.

## @hint2
Вот как устроены изменяющие методы на примере смены водителя:

```swift
enum ShiftStatus {
    case offline
    case online
    case onBreak

    mutating func endBreak() {
        switch self {
        case .onBreak:
            self = .online
        case .offline, .online:
            break
        }
    }

    mutating func goOffline() -> Bool {
        guard self == .online else {
            return false
        }
        self = .offline
        return true
    }
}
```

`self = .online` заменяет значение целиком. `break` в ветке `switch` значит «ничего не делать». `guard` пропускает дальше только разрешённый переход.

## @hint3
Свойство готово, в методах остались пропуски:

```swift
    var canCancel: Bool {
        switch self {
        case .searching, .driverOnTheWay:
            return true
        case .inProgress, .completed, .cancelled:
            return false
        }
    }

    mutating func advance() {
        switch self {
        case .searching:
            self = ___
        case .driverOnTheWay:
            self = .inProgress
        case .inProgress:
            self = ___
        case .completed, .cancelled:
            ___
        }
    }

    mutating func cancel() -> Bool {
        guard ___ else {
            return false
        }
        self = .cancelled
        return true
    }
```

В первых двух пропусках — следующие состояния на пути заказа. В третьем — слово, которое значит «ничего не делать». В четвёртом — свойство, которое отвечает, можно ли отменить заказ.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `canCancel` разбирает текущее состояние и отвечает, разрешена ли отмена. `advance()` смотрит, где заказ сейчас, и присваивает `self` следующий шаг. Для `completed` и `cancelled` в ветке стоит `break`, поэтому значение остаётся прежним. `cancel()` сначала спрашивает `canCancel`. Если ответ «нет», `guard` сразу возвращает `false`, и строка `self = .cancelled` не выполняется.

**Почему так решается жалоба поддержки.** Раньше статус меняли присваиванием снаружи: `status = .driverOnTheWay`. Такое присваивание работает из любого состояния, даже из отменённого. Теперь опоздавшее событие вызывает `advance()`, а у `cancelled` этот метод ничего не делает. И кнопка «Отменить» вызывает `cancel()`, который во время поездки ответит `false`. Правила переходов записаны в одном месте, внутри типа. Обойти их можно только намеренно.

**Почему `switch`, а не цепочка `if`.** В `advance()` легко ошибиться так:

```swift
if self == .searching { self = .driverOnTheWay }
if self == .driverOnTheWay { self = .inProgress }
```

Первый `if` уже поменял значение, и второй тоже срабатывает: заказ проскакивает два шага за один вызов. `switch` выбирает ровно одну ветку по значению, которое было в начале, поэтому такой ловушки в нём нет. И он без `default`: если появится новое состояние, например «водитель ждёт у подъезда», Swift укажет на этот `switch`.

**Почему `cancel()` пользуется `canCancel`.** Правило «когда можно отменить» записано один раз. Экран показывает кнопку по `canCancel`, а метод проверяет то же самое свойство. Кнопка и метод не могут разойтись во мнениях.

**Типичные ошибки:**

- забыто слово `mutating` — Swift сообщит, что `self` внутри метода нельзя менять;
- в ветке для `completed` и `cancelled` ничего не написано — пустую ветку Swift не пропустит, нужен `break`;
- в `cancel()` сначала `self = .cancelled`, а потом проверка `canCancel` — к этому моменту заказ уже отменён, и метод всегда отвечает `false`;
- повторная отмена возвращает `true` — у `cancelled` свойство `canCancel` должно быть `false`.
