---
title: Сравнить и упорядочить
concept: Стандартные протоколы Equatable, Hashable, Comparable и static-требование
---

## @description

### Контекст
Две задачи из трекера, и обе про сравнение.

Первая — от тестировщицы: «Импортировала контакты из телефонной книги, и сестра появилась в списке дважды. А ещё контакты стоят вперемешку — нужно по алфавиту».

Вторая — от дизайнера группового чата: «Под сообщением в группе показываем одну галочку статуса. Сообщение считается прочитанным, только когда его прочитали все. Значит, показывать нужно самый "отстающий" статус из всех участников».

Чтобы Swift умел находить одинаковые контакты, сортировать их и выбирать наименьший статус, типам нужно выдать нужные способности. Каждая такая способность — стандартный протокол.

### Новое в Swift
В стандартной библиотеке Swift много готовых протоколов. Три из них встречаются чаще всего.

**`Equatable` — «можно сравнить на равенство».** Требует оператор `==`. Для структуры, у которой все свойства сами умеют сравниваться, Swift напишет `==` сам — достаточно подписаться:

```swift
struct ChatTheme: Equatable {
    let name: String
    let isDark: Bool
}

print(ChatTheme(name: "Ночь", isDark: true) == ChatTheme(name: "Ночь", isDark: true))   // true
```

Два значения равны, если равны все их свойства. Перечисления без связанных значений умеют `==` даже без подписи. А вот в такси «Ветер» перечисление со связанными значениями сравнить не получилось — теперь ты знаешь, чего ему не хватало: `Equatable`.

**`Hashable` — «можно положить в `Set` и сделать ключом словаря».** Swift вычисляет для значения хеш — числовой «отпечаток», по которому быстро ищет его в коллекции. `Hashable` включает в себя `Equatable`, и для простых структур Swift тоже всё напишет сам:

```swift
struct Tag: Hashable {
    let title: String
}

let tags = Set([Tag(title: "кино"), Tag(title: "книги"), Tag(title: "кино")])
print(tags.count)   // 2 - одинаковые теги склеились
```

**`Comparable` — «можно упорядочить».** Требует оператор `<`. Получив его, тип сразу умеет `>`, `<=`, `>=`, а массивы таких значений — `sorted()`, `min()` и `max()`.

У перечисления без связанных значений порядок берётся из объявления: чем раньше вариант, тем он «меньше».

```swift
enum Priority: Comparable {
    case low
    case normal
    case urgent
}

print(Priority.low < .urgent)                   // true
let top = [Priority.urgent, .low, .normal].max()   // Optional(urgent)
```

Для структуры Swift не угадает, что значит «меньше», и `<` нужно написать самой:

```swift
struct Reaction: Comparable {
    let name: String
    let count: Int

    static func < (lhs: Reaction, rhs: Reaction) -> Bool {
        return lhs.count < rhs.count
    }
}
```

Это обычная функция, только её имя — сам знак `<`. Она `static`, потому что сравнивает два значения и не принадлежит ни одному из них: протоколы могут требовать и такие, «типовые», члены. `lhs` и `rhs` — общепринятые имена: левая и правая часть выражения `a < b` (left-hand side и right-hand side). Между `<` и скобкой ставится пробел.

### Задача
1. Подпиши структуру `Contact` на `Hashable` и `Comparable`.
2. Напиши в `Contact` оператор `<`: контакты сравниваются по `name`, а если имена одинаковые — по `phone`.
3. Подпиши перечисление `DeliveryStatus` на `Comparable`. Порядок вариантов в нём уже правильный, его не меняй.
4. Напиши функцию `uniqueContacts(_:)`. Получает `[Contact]`, возвращает `[Contact]`: без повторов и отсортированный по возрастанию. Используй `Set`.
5. Напиши функцию `groupStatus(_:)`. Получает `[DeliveryStatus]`, возвращает `DeliveryStatus?`: самый ранний статус из массива, а для пустого массива — `nil`.

### Пример
Сценарий внизу редактора должен вывести:

```text
Дубликат: true
Билол, +7 900 111-22-33
Мама, +7 900 555-66-77
Сестра, +7 900 222-33-44
Статус в группе: delivered
Отправлено раньше, чем прочитано: true
```

## @starter
```swift
// 1. Подпиши Contact на Hashable и Comparable
// 2. Напиши оператор <: сначала по name, при равных именах по phone
struct Contact {
    let name: String
    let phone: String
}

// 3. Подпиши DeliveryStatus на Comparable. Варианты идут от раннего к позднему
enum DeliveryStatus {
    case sending
    case sent
    case delivered
    case read
}

// 4. Контакты без повторов, по возрастанию


// 5. Самый ранний статус из всех участников группы


// Контакты из телефонной книги: сестра попала в импорт дважды
let imported = [
    Contact(name: "Сестра", phone: "+7 900 222-33-44"),
    Contact(name: "Билол", phone: "+7 900 111-22-33"),
    Contact(name: "Мама", phone: "+7 900 555-66-77"),
    Contact(name: "Сестра", phone: "+7 900 222-33-44")
]
print("Дубликат: \(imported[0] == imported[3])")
for contact in uniqueContacts(imported) {
    print("\(contact.name), \(contact.phone)")
}

// Статусы одного сообщения у трёх участников группового чата
let statuses: [DeliveryStatus] = [.read, .delivered, .read]
if let status = groupStatus(statuses) {
    print("Статус в группе: \(status)")
}
print("Отправлено раньше, чем прочитано: \(DeliveryStatus.sent < .read)")
```

## @solution
```swift
// 1. Подпиши Contact на Hashable и Comparable
// 2. Напиши оператор <: сначала по name, при равных именах по phone
struct Contact: Hashable, Comparable {
    let name: String
    let phone: String

    static func < (lhs: Contact, rhs: Contact) -> Bool {
        if lhs.name != rhs.name {
            return lhs.name < rhs.name
        }
        return lhs.phone < rhs.phone
    }
}

// 3. Подпиши DeliveryStatus на Comparable. Варианты идут от раннего к позднему
enum DeliveryStatus: Comparable {
    case sending
    case sent
    case delivered
    case read
}

// 4. Контакты без повторов, по возрастанию
func uniqueContacts(_ contacts: [Contact]) -> [Contact] {
    return Set(contacts).sorted()
}

// 5. Самый ранний статус из всех участников группы
func groupStatus(_ statuses: [DeliveryStatus]) -> DeliveryStatus? {
    return statuses.min()
}

// Контакты из телефонной книги: сестра попала в импорт дважды
let imported = [
    Contact(name: "Сестра", phone: "+7 900 222-33-44"),
    Contact(name: "Билол", phone: "+7 900 111-22-33"),
    Contact(name: "Мама", phone: "+7 900 555-66-77"),
    Contact(name: "Сестра", phone: "+7 900 222-33-44")
]
print("Дубликат: \(imported[0] == imported[3])")
for contact in uniqueContacts(imported) {
    print("\(contact.name), \(contact.phone)")
}

// Статусы одного сообщения у трёх участников группового чата
let statuses: [DeliveryStatus] = [.read, .delivered, .read]
if let status = groupStatus(statuses) {
    print("Статус в группе: \(status)")
}
print("Отправлено раньше, чем прочитано: \(DeliveryStatus.sent < .read)")
```

## @output
```
Дубликат: true
Билол, +7 900 111-22-33
Мама, +7 900 555-66-77
Сестра, +7 900 222-33-44
Статус в группе: delivered
Отправлено раньше, чем прочитано: true
```

## @tests
```swift
let __t_bilol = Contact(name: "Билол", phone: "+7 900 111-22-33")
let __t_bilolWork = Contact(name: "Билол", phone: "+7 900 999-00-00")
let __t_mom = Contact(name: "Мама", phone: "+7 900 555-66-77")
let __t_courier = Contact(name: "Курьер", phone: "+7 900 444-00-11")

__ok("Contact подписан на Hashable", (__t_bilol as Any) is any Hashable, hint: "После имени структуры перечисли протоколы через запятую: struct Contact: Hashable, Comparable")
__eq("Одинаковые контакты равны", __t_bilol == Contact(name: "Билол", phone: "+7 900 111-22-33"), true)
__eq("Тот же человек с другим номером - другой контакт", __t_bilol == __t_bilolWork, false)

__eq("Билол раньше мамы по алфавиту", __t_bilol < __t_mom, true, hint: "Оператор < сравнивает контакты по name")
__eq("Мама не раньше Билола", __t_mom < __t_bilol, false, hint: "Сравнивай lhs.name < rhs.name, а не наоборот")
__eq("Курьер раньше мамы", __t_courier < __t_mom, true)
__eq("Имена одинаковые - сравниваются номера", __t_bilol < __t_bilolWork, true, hint: "Если имена равны, сравни phone: +7 900 111-22-33 меньше, чем +7 900 999-00-00")
__eq("Имена одинаковые, номер больше - не меньше", __t_bilolWork < __t_bilol, false, hint: "При равных именах результат зависит только от номеров")
__eq("Контакт не меньше самого себя", __t_mom < __t_mom, false, hint: "Для одинаковых контактов < должен давать false")
__eq("Сортировка контактов", [__t_mom, __t_bilolWork, __t_courier, __t_bilol].sorted(), [__t_bilol, __t_bilolWork, __t_courier, __t_mom], hint: "Сначала по name, при равных именах по phone")

__eq("Без повторов и по алфавиту", uniqueContacts([__t_mom, __t_bilol, __t_mom, __t_courier, __t_bilol]), [__t_bilol, __t_courier, __t_mom], hint: "Сложи контакты в Set, чтобы убрать повторы, и отсортируй результат: порядок в Set случайный")
__eq("Тот же человек с двумя номерами - два контакта", uniqueContacts([__t_bilolWork, __t_bilol]), [__t_bilol, __t_bilolWork])
__eq("Один контакт", uniqueContacts([__t_courier]), [__t_courier])
__eq("Пустой импорт", uniqueContacts([]), [], hint: "Для пустого массива верни пустой массив")

__eq("Отправляется раньше, чем отправлено", DeliveryStatus.sending < .sent, true, hint: "Подпиши DeliveryStatus на Comparable и не меняй порядок вариантов")
__eq("Доставлено раньше, чем прочитано", DeliveryStatus.delivered < .read, true)
__eq("Прочитано не раньше, чем доставлено", DeliveryStatus.read < .delivered, false)

__eq("Группа: двое прочитали, один получил", groupStatus([.read, .delivered, .read]), .delivered, hint: "Нужен самый ранний статус: min()")
__eq("Группа: один ещё отправляется", groupStatus([.read, .sending, .delivered]), .sending)
__eq("Группа: все прочитали", groupStatus([.read, .read]), .read)
__eq("Группа из одного участника", groupStatus([.sent]), .sent)
__eq("Нет участников - nil", groupStatus([]), nil, hint: "Для пустого массива верни nil: min() так и делает")
```

## @rules
- must: /\bSet\s*[(<]/ :: В `uniqueContacts` убери повторы с помощью `Set`: `Set(contacts)`.
- must: /static\s+func\s*<\s*\(/ :: Напиши в `Contact` оператор сравнения: `static func < (lhs: Contact, rhs: Contact) -> Bool`.
- must: /\benum\s+DeliveryStatus\s*:[^{]*\bComparable\b/ :: Подпиши перечисление на `Comparable`: `enum DeliveryStatus: Comparable`.

## @hint1
Начни с подписей. После имени структуры `Contact` через двоеточие перечисли два протокола через запятую. После имени перечисления — один. Для перечисления на этом всё: порядок вариантов уже задаёт, кто «меньше».

Для структуры осталось написать оператор `<`. Это статическая функция с именем `<`, двумя параметрами типа `Contact` и результатом `Bool`. Внутри сначала проверь, отличаются ли имена. Если да — ответ даёт сравнение имён. Если имена одинаковые — сравнение телефонов.

`==` и хеш для `Contact` писать не нужно: Swift соберёт их сам, потому что `name` и `phone` — строки, а строки это умеют.

`uniqueContacts` — одна строка: сделай из массива `Set`, и повторы исчезнут, а потом отсортируй. Сортировка обязательна: порядок элементов в `Set` случайный.

`groupStatus` — тоже одна строка. Самый ранний статус — это минимальный. Метод для этого возвращает опционал, и для пустого массива он сам даст `nil`.

## @hint2
Оператор `<` для структуры записывается так:

```swift
struct Reaction: Comparable {
    let name: String
    let count: Int

    static func < (lhs: Reaction, rhs: Reaction) -> Bool {
        return lhs.count < rhs.count
    }
}
```

В твоём `<` два шага: сначала имена, а при равных именах — телефоны. А убрать повторы и отсортировать можно одной цепочкой: `Set(...)` и `.sorted()`.

## @hint3
Заполни пропуски:

```swift
struct Contact: Hashable, ___ {
    let name: String
    let phone: String

    static func < (lhs: Contact, rhs: Contact) -> Bool {
        if lhs.name != rhs.name {
            return lhs.name < rhs.name
        }
        return ___
    }
}

enum DeliveryStatus: Comparable {
    case sending
    case sent
    case delivered
    case read
}

func uniqueContacts(_ contacts: [Contact]) -> [Contact] {
    return Set(contacts).___
}

func groupStatus(_ statuses: [DeliveryStatus]) -> DeliveryStatus? {
    return statuses.min()
}
```

В первом пропуске — протокол для упорядочивания. Во втором — сравнение телефонов. В третьем — вызов сортировки.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Подпись на `Hashable` даёт `Contact` сразу две способности: `==` (из `Equatable`, который входит в `Hashable`) и хеш. Обе Swift собрал сам, сравнивая `name` и `phone`. Поэтому `imported[0] == imported[3]` — `true`, а `Set(contacts)` склеивает две записи сестры в одну.

Подпись на `Comparable` требует `<`, и его ты написала сама. Когда имена разные, всё решает алфавит. Когда одинаковые — номер телефона: так у сортировки не остаётся ничьих, и результат всегда один и тот же. Получив `<`, массив контактов научился `sorted()` без всяких замыканий.

`DeliveryStatus` получил `<` бесплатно: `sending` меньше `sent`, `sent` меньше `delivered` и так далее — в порядке объявления. Поэтому `min()` находит самый «отстающий» статус, а для пустого массива возвращает `nil`.

**Почему после `Set` нужна сортировка.** `Set` хранит элементы в непредсказуемом порядке, он может меняться от запуска к запуску. Список контактов на экране так прыгать не должен.

**Типичные ошибки:**

- `<` сравнивает только имена — тогда у двух записей Билола с разными номерами порядок не определён;
- `>` вместо `<` внутри оператора — список выйдет в обратном порядке;
- забыто `static` — Swift сообщит, что оператор должен быть объявлен как `static`;
- варианты перечисления переставлены — изменится и порядок статусов, ведь он берётся из объявления.
