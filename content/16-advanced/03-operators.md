---
title: Сравнение версий
concept: Перегрузка операторов — свои ==, <, + и Comparable
---

## @description

### Контекст
«Чернила» синхронизируют заметки между телефоном и ноутбуком. Старые версии приложения хранят заметки в устаревшем формате, поэтому сервер сообщает минимальную версию, с которой синхронизация разрешена.

В тикете от поддержки: «У пользователя версия 2.9.3, минимальная 2.10.0, а синхронизация включена и портит заметки». Причина — версии сравнивались как строки. Строки сравниваются по буквам: в `"2.9.3"` и `"2.10.0"` первая разница — `9` против `1`, и Swift решает, что `"2.9.3"` больше.

Тимлид: «Сделай `Version` сравнимой. Пусть `installed < minimum` сравнивает числа по порядку: сначала главную часть, потом среднюю, потом последнюю. А номер сборки при сравнении не учитывай: у телефона и ноутбука он свой, но версия одна».

### Новое в Swift
**Оператор — это функция.** Когда ты пишешь `a + b`, Swift вызывает функцию с именем `+` и двумя аргументами. Для чисел и строк такие функции уже написаны. Для своего типа их можно объявить самой. Это называется **перегрузкой оператора**.

Оператор объявляется внутри типа как `static func`, а вместо имени стоит его знак. Параметры принято называть `lhs` и `rhs` — левая и правая части (left-hand side, right-hand side):

```swift
struct Distance {
    var meters: Int

    static func + (lhs: Distance, rhs: Distance) -> Distance {
        return Distance(meters: lhs.meters + rhs.meters)
    }

    static func += (lhs: inout Distance, rhs: Distance) {
        lhs.meters += rhs.meters
    }
}

var walk = Distance(meters: 1200) + Distance(meters: 800)   // 2000 м
walk += Distance(meters: 500)                                // 2500 м
```

У `+=` левая часть меняется на месте, поэтому она `inout` — как в функциях из модуля про функции.

**Сравнение: `==` и `<`.** Протокол `Equatable` требует оператор `==`, а `Comparable` — оператор `<`. Ты уже встречала их. Если не писать `==` самой, Swift сгенерирует его сам: два значения равны, когда равны **все** их свойства. Но иногда это неправильно — тогда `==` пишут вручную и решают, какие свойства важны:

```swift
struct Ticket: Comparable {
    let seat: Int
    let buyer: String

    // Место одно и то же, кто бы ни купил билет
    static func == (lhs: Ticket, rhs: Ticket) -> Bool {
        return lhs.seat == rhs.seat
    }

    static func < (lhs: Ticket, rhs: Ticket) -> Bool {
        return lhs.seat < rhs.seat
    }
}
```

Написав только `==` и `<`, ты бесплатно получаешь `!=`, `>`, `<=`, `>=`, а ещё `sorted()`, `min()` и `max()` для массивов. Swift выводит их из этих двух.

> ⚠️ `==` и `<` должны договориться между собой. Если для `==` какое-то свойство не важно, `<` тоже не должен на него смотреть. Иначе может оказаться, что `a == b`, но при этом `a < b`.

> 💡 Swift разрешает придумывать и совсем новые операторы вроде `<=>`. Но в командах их почти не используют: чужой код с непонятными значками трудно читать. Перегружай только тогда, когда смысл знака очевиден без пояснений.

### Задача
В редакторе есть структура `Version` с полями `major`, `minor`, `patch` (числа) и `build` (строка — номер сборки).

1. Допиши расширение `extension Version: Comparable`:
   - `static func ==` — версии равны, если у них одинаковые `major`, `minor` и `patch`. Поле `build` не учитывается.
   - `static func <` — сначала сравни `major`. Если они равны — `minor`. Если и они равны — `patch`. Поле `build` не учитывается.
2. Напиши функцию `isSyncAllowed(_:minimum:)`. Первый параметр (без метки) — установленная версия, второй — минимальная, оба типа `Version`. Возвращает `Bool`: `true`, если установленная версия не ниже минимальной. Используй оператор сравнения версий, а не сравнение полей.

Код внизу уже готов: он проверит телефон и ноутбук.

### Пример
```swift
let a = Version(major: 2, minor: 9, patch: 3, build: "ios-498")
let b = Version(major: 2, minor: 10, patch: 0, build: "server")
a < b                                  // true
a == Version(major: 2, minor: 9, patch: 3, build: "mac-87")   // true
isSyncAllowed(a, minimum: b)           // false
isSyncAllowed(b, minimum: b)           // true
```

## @starter
```swift
// Версия приложения: 2.10.1, сборка mac-87
struct Version {
    let major: Int
    let minor: Int
    let patch: Int
    let build: String

    // Текст для экрана: 2.10.1
    var text: String {
        "\(major).\(minor).\(patch)"
    }
}

// 1. Научи версии сравниваться: напиши операторы == и <
extension Version: Comparable {

}

// 2. Можно ли синхронизировать: установленная версия не ниже минимальной
func isSyncAllowed(_ installed: Version, minimum: Version) -> Bool {

}

// Проверка устройств. Этот код уже готов — менять его не нужно
let phone = Version(major: 2, minor: 9, patch: 3, build: "ios-498")
let laptop = Version(major: 2, minor: 10, patch: 1, build: "mac-87")
let minimum = Version(major: 2, minor: 10, patch: 0, build: "server")

for device in [phone, laptop] {
    if isSyncAllowed(device, minimum: minimum) {
        print("\(device.text): синхронизация включена")
    } else {
        print("\(device.text): обнови приложение до \(minimum.text)")
    }
}
```

## @solution
```swift
// Версия приложения: 2.10.1, сборка mac-87
struct Version {
    let major: Int
    let minor: Int
    let patch: Int
    let build: String

    // Текст для экрана: 2.10.1
    var text: String {
        "\(major).\(minor).\(patch)"
    }
}

// 1. Научи версии сравниваться: напиши операторы == и <
extension Version: Comparable {
    static func == (lhs: Version, rhs: Version) -> Bool {
        return lhs.major == rhs.major && lhs.minor == rhs.minor && lhs.patch == rhs.patch
    }

    static func < (lhs: Version, rhs: Version) -> Bool {
        if lhs.major != rhs.major {
            return lhs.major < rhs.major
        }
        if lhs.minor != rhs.minor {
            return lhs.minor < rhs.minor
        }
        return lhs.patch < rhs.patch
    }
}

// 2. Можно ли синхронизировать: установленная версия не ниже минимальной
func isSyncAllowed(_ installed: Version, minimum: Version) -> Bool {
    return installed >= minimum
}

// Проверка устройств. Этот код уже готов — менять его не нужно
let phone = Version(major: 2, minor: 9, patch: 3, build: "ios-498")
let laptop = Version(major: 2, minor: 10, patch: 1, build: "mac-87")
let minimum = Version(major: 2, minor: 10, patch: 0, build: "server")

for device in [phone, laptop] {
    if isSyncAllowed(device, minimum: minimum) {
        print("\(device.text): синхронизация включена")
    } else {
        print("\(device.text): обнови приложение до \(minimum.text)")
    }
}
```

## @output
```
2.9.3: обнови приложение до 2.10.0
2.10.1: синхронизация включена
```

## @tests
```swift
func __t_v(_ major: Int, _ minor: Int, _ patch: Int, _ build: String = "test") -> Version {
    return Version(major: major, minor: minor, patch: patch, build: build)
}

__ok("2.10.1 на телефоне и на ноутбуке — одна версия", __t_v(2, 10, 1, "ios-512") == __t_v(2, 10, 1, "mac-87"), hint: "В == сравнивай только major, minor и patch. Автоматический == сравнивает и build, поэтому его нужно написать самой")
__ok("2.10.1 и 2.10.2 — разные версии", __t_v(2, 10, 1) != __t_v(2, 10, 2), hint: "В == должны участвовать все три числа: major, minor и patch")
__ok("2.10.1 и 2.11.1 — разные версии", __t_v(2, 10, 1) != __t_v(2, 11, 1))
__ok("2.10.1 и 3.10.1 — разные версии", __t_v(2, 10, 1) != __t_v(3, 10, 1))

__ok("2.9.9 меньше 2.10.0", __t_v(2, 9, 9) < __t_v(2, 10, 0), hint: "Сравнивай числа, а не текст: 9 меньше 10")
__ok("2.10.0 не меньше 2.9.9", !(__t_v(2, 10, 0) < __t_v(2, 9, 9)), hint: "Главные части равны, а средние разные: 10 больше 9, значит, на patch смотреть уже не нужно")
__ok("1.99.99 меньше 2.0.0: главная часть важнее остальных", __t_v(1, 99, 99) < __t_v(2, 0, 0), hint: "Если major разные, результат решает только major")
__ok("2.0.5 не меньше 1.9.0", !(__t_v(2, 0, 5) < __t_v(1, 9, 0)), hint: "Если major разные, на minor и patch смотреть уже не нужно. Проверка вида major < major || minor < minor здесь ошибается")
__ok("3.1.4 меньше 3.1.5: решает последняя часть", __t_v(3, 1, 4) < __t_v(3, 1, 5))
__ok("3.2.0 не меньше 3.1.9", !(__t_v(3, 2, 0) < __t_v(3, 1, 9)), hint: "Если major равны, а minor разные, решает только minor")
__ok("Версия не меньше самой себя", !(__t_v(2, 10, 1) < __t_v(2, 10, 1)), hint: "Для одинаковых версий < должен вернуть false")
__ok("Номер сборки не влияет на <", !(__t_v(2, 10, 1, "a") < __t_v(2, 10, 1, "b")) && !(__t_v(2, 10, 1, "b") < __t_v(2, 10, 1, "a")))
__ok("Оператор > работает сам: 4.0.0 больше 3.9.9", __t_v(4, 0, 0) > __t_v(3, 9, 9))

let __t_sorted = [__t_v(2, 10, 0), __t_v(1, 2, 3), __t_v(2, 9, 12), __t_v(2, 9, 3)].sorted()
__eq("Список версий сортируется по возрастанию", __t_sorted.map { $0.text }, ["1.2.3", "2.9.3", "2.9.12", "2.10.0"])

__eq("Синхронизация: 2.9.3 при минимуме 2.10.0 запрещена", isSyncAllowed(__t_v(2, 9, 3), minimum: __t_v(2, 10, 0)), false)
__eq("Синхронизация: 2.10.1 при минимуме 2.10.0 разрешена", isSyncAllowed(__t_v(2, 10, 1), minimum: __t_v(2, 10, 0)), true)
__eq("Синхронизация: ровно минимальная версия разрешена", isSyncAllowed(__t_v(2, 10, 0, "ios-500"), minimum: __t_v(2, 10, 0, "server")), true, hint: "Версия, равная минимальной, подходит: нужно «не ниже», то есть >=")
__eq("Синхронизация: 3.0.0 при минимуме 2.10.0 разрешена", isSyncAllowed(__t_v(3, 0, 0), minimum: __t_v(2, 10, 0)), true)
__eq("Синхронизация: 1.20.0 при минимуме 2.0.0 запрещена", isSyncAllowed(__t_v(1, 20, 0), minimum: __t_v(2, 0, 0)), false)
```

## @rules
- must: /static\s+func\s*==\s*\(/ :: Напиши свой оператор `static func ==` — автоматический сравнивает и номер сборки.
- must: /static\s+func\s*<\s*\(/ :: Напиши оператор `static func <` — его требует протокол `Comparable`.
- mustnot: /\.text\s*(?:[<>]=?|==)|(?:[<>]=?|==)\s*\w+\.text\b/ :: Не сравнивай версии через `text`: строки сравниваются по буквам, и 2.9.3 окажется больше 2.10.0.

## @hint1
Операторы пишутся внутри расширения `extension Version: Comparable`. Каждый из них — это `static func`, у которого вместо имени стоит знак, два параметра `lhs` и `rhs` типа `Version` и результат `Bool`.

Оператор `==` — одна строка: три равенства, соединённые через «и». Номер сборки в ней не упоминается.

Оператор `<` сравнивает части по очереди. Если главные части разные, ответ уже понятен: меньше та версия, у которой главная часть меньше. Если главные равны — так же со средней частью. Если и средние равны — всё решает последняя.

Функция `isSyncAllowed` — тоже одна строка. Раз ты научила версии сравниваться, оператор «больше или равно» у них появился сам. Им и воспользуйся.

## @hint2
Объявление оператора выглядит как обычный статический метод, только вместо имени — знак:

```swift
static func == (lhs: Version, rhs: Version) -> Bool {
    return lhs.major == rhs.major && ...
}
```

В `<` каждую часть удобно проверять так: «если части разные — верни результат их сравнения»:

```swift
if lhs.major != rhs.major {
    return lhs.major < rhs.major
}
```

## @hint3
Осталось три пропуска:

```swift
extension Version: Comparable {
    static func == (lhs: Version, rhs: Version) -> Bool {
        return lhs.major == rhs.major && lhs.minor == rhs.minor && ___
    }

    static func < (lhs: Version, rhs: Version) -> Bool {
        if lhs.major != rhs.major {
            return lhs.major < rhs.major
        }
        if lhs.minor != rhs.minor {
            return lhs.minor < rhs.minor
        }
        return ___
    }
}

func isSyncAllowed(_ installed: Version, minimum: Version) -> Bool {
    return installed ___ minimum
}
```

В первом пропуске — сравнение последних частей на равенство. Во втором — сравнение последних частей на «меньше». В третьем — оператор «больше или равно».

## @hint4
Вот готовое решение:

{{solution}}

**Почему `==` написан вручную.** Без него Swift сгенерировал бы `==` сам и сравнил бы все четыре поля. Тогда версия 2.10.1 с телефона (`ios-512`) и с ноутбука (`mac-87`) оказались бы разными, хотя приложение одно и то же. Свой `==` говорит: важны только три числа.

**Как работает `<`.** Части сравниваются по старшинству, как слова в словаре по буквам. Если главные части различаются, результат определяется только ими: 1.99.99 меньше 2.0.0, какими бы ни были остальные числа. Только когда главные равны, смотрим на среднюю часть, и так далее. Если равны все три, последняя строка вернёт `false` — версия не меньше самой себя.

**Откуда взялся `>=`.** Ты написала только `==` и `<`. Протокол `Comparable` сам выводит из них `>`, `<=`, `>=`, а массив версий научился `sorted()` и `max()`. Поэтому `isSyncAllowed` — одна понятная строка: `installed >= minimum`.

**Короткий вариант.** В Swift кортежи из чисел тоже можно сравнивать, и они сравниваются по очереди, слева направо. Тело `<` можно записать одной строкой: `(lhs.major, lhs.minor, lhs.patch) < (rhs.major, rhs.minor, rhs.patch)`. Решение с тремя `if` длиннее, но показывает логику явно.

**Типичные ошибки:**

- `lhs.major < rhs.major || lhs.minor < rhs.minor || lhs.patch < rhs.patch` — тогда 2.0.5 окажется меньше 1.9.0, ведь 0 меньше 9;
- сравнение `text` у версий — строки сравниваются по буквам, и вернётся исходная ошибка из тикета;
- `installed > minimum` вместо `>=` — версия, ровно равная минимальной, будет зря отвергнута.
