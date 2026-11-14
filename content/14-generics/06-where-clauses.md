---
title: Только для подходящих
concept: where, условные расширения и условное соответствие протоколу
---

## @description

### Контекст
Почти каждый экран в приложениях студии — это список с секциями: «Сегодня» и «Вчера» в «Почтальоне», «Хиты» и «Новинки» в «Ярмарке», «Доходы» и «Расходы» в «Монете». В «Каркасе» для этого есть обобщённая структура `ListSection<Item>`: заголовок и элементы любого типа.

Команды просят добавить к ней удобства. «Почтальону» нужен поиск элемента по id — но у элементов не всегда есть id. «Монете» нужна сумма секции — но складывать можно только числа. А всем вместе нужно понимать, изменилась ли секция, чтобы не перерисовывать экран зря. Тимлид: «Значит, эти возможности должны появляться только у тех секций, где они имеют смысл».

### Новое в Swift
**Расширение с условием.** Расширение обобщённого типа можно ограничить словом `where`. Всё, что в нём объявлено, появится только у тех вариантов типа, которые подходят под условие.

Пример: отчёт со строками любого типа.

```swift
struct Report<Row> {
    let name: String
    var rows: [Row]
}

extension Report where Row: Comparable {
    var sortedRows: [Row] {
        return rows.sorted()
    }
}
```

У `Report<Int>` и `Report<String>` свойство `sortedRows` есть: числа и строки умеют сравниваться. А у отчёта из структур без `Comparable` его просто нет — Swift даже не предложит его в подсказках. Внутри такого расширения можно пользоваться всем, что умеет `Comparable`, например `sorted()`.

Условие бывает двух видов:

- `where Row: Протокол` — «тип соответствует протоколу»;
- `where Row == Double` — «тип ровно такой». Тогда внутри `rows` — это обычный `[Double]`, и с ним можно делать всё, что с массивом чисел:

```swift
extension Report where Row == Double {
    var average: Double {
        if rows.isEmpty {
            return 0
        }
        let sum = rows.reduce(0) { $0 + $1 }
        return sum / Double(rows.count)
    }
}
```

**Условное соответствие протоколу.** Расширение может добавить и сам протокол — тоже с условием:

```swift
extension Report: Equatable where Row: Equatable {}
```

Читается так: «отчёты можно сравнивать через `==`, если можно сравнивать их строки». Фигурные скобки пустые: как и в модуле про протоколы, Swift сам напишет `==`, сравнив все свойства по очереди.

**`where` у функции.** То же условие можно написать и после объявления функции. Это равносильно ограничению в угловых скобках, но удобнее, когда условий несколько или они длинные:

```swift
func allSame<T>(_ values: [T]) -> Bool where T: Equatable {
    return values.allSatisfy { $0 == values[0] }
}
```

> 💡 У `Identifiable`-типа есть свойство `id`, а его тип записывается как `Item.ID`. Он всегда `Hashable`, поэтому id можно сравнивать через `==`.

### Задача
В редакторе есть структура `ListSection<Item>` со свойствами `title` и `items`. Саму структуру не меняй — всё новое добавляй расширениями.

1. Расширение `ListSection` с условием «`Item` соответствует `Identifiable`». В нём метод `item(withId:)`: принимает id типа `Item.ID`, возвращает `Item?` — первый элемент с таким id или `nil`.
2. Расширение `ListSection` с условием «`Item` — это ровно `Int`». В нём вычисляемое свойство `total` типа `Int` — сумма всех элементов. Для пустой секции — `0`.
3. Условное соответствие: `ListSection` соответствует `Equatable`, если `Item` соответствует `Equatable`. Две секции равны, если у них одинаковые заголовки и элементы.
4. Обобщённая функция `changedTitles(from:to:)` с условием `where` «элементы `Equatable`». Параметры — старый и новый массивы секций с элементами одного типа. Возвращает `[String]` — заголовки тех секций нового массива, которые изменились: на том же месте в старом массиве другая секция или старый массив короче. Порядок — как в новом массиве.

### Пример
```swift
let incomes = ListSection(title: "Доходы", items: [52000, 7500])
incomes.total      // 59500

incomes == ListSection(title: "Доходы", items: [52000, 7500])   // true

let old = [ListSection(title: "Сегодня", items: ["Привет"]), ListSection(title: "Вчера", items: ["Ок"])]
let new = [ListSection(title: "Сегодня", items: ["Привет", "Ты где?"]), ListSection(title: "Вчера", items: ["Ок"]),
           ListSection(title: "Неделя назад", items: ["Счёт"])]
changedTitles(from: old, to: new)   // ["Сегодня", "Неделя назад"]
```

## @starter
```swift
// Секция списка на экране: заголовок и элементы любого типа
struct ListSection<Item> {
    let title: String
    var items: [Item]
}

// 1. Поиск по id: только для секций с Identifiable-элементами


// 2. Сумма: только для секций с элементами Int


// 3. Сравнение секций: только если элементы можно сравнивать


// 4. Заголовки изменившихся секций: функция с условием where

```

## @solution
```swift
// Секция списка на экране: заголовок и элементы любого типа
struct ListSection<Item> {
    let title: String
    var items: [Item]
}

// 1. Поиск по id: только для секций с Identifiable-элементами
extension ListSection where Item: Identifiable {
    func item(withId id: Item.ID) -> Item? {
        return items.first(where: { $0.id == id })
    }
}

// 2. Сумма: только для секций с элементами Int
extension ListSection where Item == Int {
    var total: Int {
        return items.reduce(0) { $0 + $1 }
    }
}

// 3. Сравнение секций: только если элементы можно сравнивать
extension ListSection: Equatable where Item: Equatable {}

// 4. Заголовки изменившихся секций: функция с условием where
func changedTitles<Item>(from old: [ListSection<Item>], to new: [ListSection<Item>]) -> [String] where Item: Equatable {
    var titles: [String] = []
    for (index, section) in new.enumerated() {
        if index >= old.count || old[index] != section {
            titles.append(section.title)
        }
    }
    return titles
}
```

## @tests
```swift
struct __t_Chat: Identifiable {
    let id: Int
    let lastMessage: String
}
let __t_today = ListSection(title: "Сегодня", items: [__t_Chat(id: 7, lastMessage: "Созвон в 18:00"), __t_Chat(id: 12, lastMessage: "Счёт во вложении"), __t_Chat(id: 7, lastMessage: "Повтор id")])
__eq("Поиск по id (Int): чат 12 найден", __t_today.item(withId: 12)?.lastMessage, "Счёт во вложении")
__eq("Поиск по id: при двух одинаковых id — первый элемент", __t_today.item(withId: 7)?.lastMessage, "Созвон в 18:00", hint: "Верни первый элемент с таким id")
__eq("Поиск по id: неизвестный id — nil", __t_today.item(withId: 99) == nil, true, hint: "Если элемента с таким id нет, верни nil")
__eq("Поиск по id: пустая секция — nil", ListSection<__t_Chat>(title: "Пусто", items: []).item(withId: 1) == nil, true)

struct __t_Contact: Identifiable {
    let id: String
    let status: String
}
let __t_contacts = ListSection(title: "Контакты", items: [__t_Contact(id: "bilol", status: "В сети"), __t_Contact(id: "night_owl", status: "Был вчера")])
__eq("Поиск по id (String): контакт night_owl", __t_contacts.item(withId: "night_owl")?.status, "Был вчера", hint: "Тип id бывает любым: числом, строкой. Поэтому параметр имеет тип Item.ID")

__eq("Сумма секции Доходы", ListSection(title: "Доходы", items: [52000, 7500]).total, 59500)
__eq("Сумма секции с одним элементом", ListSection(title: "Кэшбэк", items: [340]).total, 340)
__eq("Сумма пустой секции — 0", ListSection<Int>(title: "Расходы", items: []).total, 0, hint: "Для пустой секции сумма равна 0")
__eq("Сумма с возвратом (отрицательное число)", ListSection(title: "Возвраты", items: [1200, -300]).total, 900)

let __t_a = ListSection(title: "Хиты", items: ["Плед", "Свеча"])
__ok("Секции с одинаковыми заголовком и элементами равны", __t_a == ListSection(title: "Хиты", items: ["Плед", "Свеча"]))
__ok("Другой заголовок — секции не равны", __t_a != ListSection(title: "Новинки", items: ["Плед", "Свеча"]), hint: "Сравниваются и заголовок, и элементы")
__ok("Другие элементы — секции не равны", __t_a != ListSection(title: "Хиты", items: ["Свеча", "Плед"]))

struct __t_Point: Equatable {
    let day: Int
    let steps: Int
}
let __t_p = ListSection(title: "Неделя", items: [__t_Point(day: 1, steps: 8000)])
__ok("Секции со структурами проверки (Equatable) сравниваются", __t_p == ListSection(title: "Неделя", items: [__t_Point(day: 1, steps: 8000)]), hint: "Сравнение должно работать для любых Equatable-элементов, а не только для строк")
__ok("Секции со структурами проверки: разные шаги — не равны", __t_p != ListSection(title: "Неделя", items: [__t_Point(day: 1, steps: 9000)]))

let __t_old = [ListSection(title: "Сегодня", items: ["Привет"]), ListSection(title: "Вчера", items: ["Ок"])]
let __t_new = [ListSection(title: "Сегодня", items: ["Привет", "Ты где?"]), ListSection(title: "Вчера", items: ["Ок"]), ListSection(title: "Неделя назад", items: ["Счёт"])]
__eq("changedTitles: изменилась первая секция и добавилась третья", changedTitles(from: __t_old, to: __t_new), ["Сегодня", "Неделя назад"], hint: "Секция считается изменившейся, если на том же месте в старом массиве другая секция или старый массив короче")
__eq("changedTitles: ничего не изменилось", changedTitles(from: __t_old, to: __t_old), [], hint: "Если все секции на своих местах совпадают, верни пустой массив")
__eq("changedTitles: старого списка не было — изменились все", changedTitles(from: [], to: __t_old), ["Сегодня", "Вчера"])
__eq("changedTitles: новый список пустой", changedTitles(from: __t_old, to: [ListSection<String>]()), [])
__eq("changedTitles: секцию удалили — оставшиеся сдвинулись", changedTitles(from: __t_old, to: [ListSection(title: "Вчера", items: ["Ок"])]), ["Вчера"], hint: "Сравнивай секции на одинаковых местах: new[0] со old[0] и так далее")
__eq("changedTitles: числа и смена только заголовка", changedTitles(from: [ListSection(title: "Доходы", items: [100])], to: [ListSection(title: "Приход", items: [100])]), ["Приход"])
__eq("changedTitles: структуры проверки", changedTitles(from: [__t_p], to: [ListSection(title: "Неделя", items: [__t_Point(day: 1, steps: 9000)])]), ["Неделя"])
```

## @rules
- must: /extension\s+ListSection\s+where\s+Item\s*:\s*Identifiable/ :: Поиск по id добавь в расширение с условием: `extension ListSection where Item: Identifiable`.
- must: /extension\s+ListSection\s+where\s+Item\s*==\s*Int/ :: Сумму добавь в расширение с условием «ровно Int»: `extension ListSection where Item == Int`.
- must: /extension\s+ListSection\s*:\s*Equatable\s+where\s+Item\s*:\s*Equatable/ :: Сравнение секций добавь условным соответствием: `extension ListSection: Equatable where Item: Equatable {}`.
- must: /func\s+changedTitles[^{]*\bwhere\b/ :: Ограничение у `changedTitles` запиши через `where` после типа результата.
- mustnot: /struct\s+ListSection\s*<[^>]*:/ :: Саму структуру `ListSection` не меняй: она должна принимать элементы любого типа. Условия ставь в расширениях.

## @hint1
Четыре части, и каждая — отдельный блок кода под структурой.

Первая — расширение структуры, после имени которой стоит `where` и условие: параметр элементов соответствует `Identifiable`. Внутри — метод с меткой `withId`. Тип параметра — тип id элемента: имя параметра типа, точка, `ID`. Результат — опциональный элемент. Найти первый подходящий элемент ты умеешь методом с замыканием, который сравнивает `id` очередного элемента с переданным.

Вторая — ещё одно расширение, но условие в нём «тип элементов ровно `Int`» — через двойное равно. Внутри вычисляемое свойство: сумма массива. Свернуть массив в одно число помогает знакомый метод, который начинает с нуля и прибавляет элементы по очереди.

Третья — одна строка: расширение, в котором после имени структуры стоят двоеточие и протокол сравнения, а затем `where` и то же требование к элементам. Тело пустое.

Четвёртая — функция с параметром типа элементов. Условие пишется после типа результата, перед открывающей фигурной скобкой. Внутри пройди по новому массиву с индексами. Если индекс выходит за границы старого массива или секция на этом месте в старом массиве не равна текущей — добавь заголовок в результат. Сравнивать секции через `!=` можно как раз благодаря третьей части.

## @hint2
Расширение с условием и условное соответствие пишутся так:

```swift
extension ListSection where Item: Identifiable {
    func item(withId id: Item.ID) -> Item? {
        // первый элемент, у которого id совпадает
    }
}

extension ListSection: Equatable where Item: Equatable {}
```

А условие у функции стоит после типа результата:

```swift
func changedTitles<Item>(from old: [ListSection<Item>], to new: [ListSection<Item>]) -> [String] where Item: Equatable {
    // ...
}
```

## @hint3
Заполни пропуски:

```swift
extension ListSection where Item: Identifiable {
    func item(withId id: Item.ID) -> Item? {
        return items.first(where: { ___ })
    }
}

extension ListSection where ___ {
    var total: Int {
        return items.reduce(0) { $0 + $1 }
    }
}

extension ListSection: Equatable where Item: Equatable {}

func changedTitles<Item>(from old: [ListSection<Item>], to new: [ListSection<Item>]) -> [String] where Item: Equatable {
    var titles: [String] = []
    for (index, section) in new.enumerated() {
        if index >= old.count || ___ {
            titles.append(section.title)
        }
    }
    return titles
}
```

В первом пропуске — сравнение `id` элемента с параметром. Во втором — условие «элементы ровно `Int`». В третьем — «секция на том же месте в старом массиве отличается».

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Структура `ListSection<Item>` по-прежнему принимает элементы любого типа — её объявление не изменилось. Расширения с `where` добавляют возможности выборочно. У `ListSection<Chat>` (если `Chat` — `Identifiable`) есть `item(withId:)`, у `ListSection<Int>` есть `total`, у `ListSection<String>` нет ни того, ни другого, зато есть `==`. Swift решает, что доступно, по типу, который подставлен на место `Item`.

Внутри `where Item: Identifiable` компилятор знает: у каждого элемента есть `id`, и он `Hashable`, поэтому сравнение `$0.id == id` законно. Тип параметра `Item.ID` подстраивается: для чатов это `Int`, для контактов — `String`.

Внутри `where Item == Int` массив `items` — это просто `[Int]`, поэтому `reduce(0) { $0 + $1 }` складывает числа. Для пустой секции `reduce` вернёт начальное значение — ноль.

Строка `extension ListSection: Equatable where Item: Equatable {}` — условное соответствие. Swift сам пишет `==`, сравнивая `title` и `items`. А раз секции теперь сравниваются, в `changedTitles` можно написать `old[index] != section`.

**Почему условие `index >= old.count` стоит первым.** Оператор `||` проверяет правую часть, только если левая ложна. Если индекс уже за пределами старого массива, до `old[index]` дело не дойдёт, и программа не упадёт. Поменяешь местами — получишь выход за границы массива.

**Типичные ошибки:**

- ограничение поставлено в саму структуру: `struct ListSection<Item: Identifiable>` — тогда секции из строк и чисел станут невозможны;
- `where Item: Int` вместо `where Item == Int` — двоеточие означает «соответствует протоколу», а `Int` — это конкретный тип;
- параметр `item(withId:)` объявлен как `Int` — поиск сломается для контактов со строковыми id.
