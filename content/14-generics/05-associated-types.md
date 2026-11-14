---
title: Любое хранилище
concept: associatedtype — тип-заполнитель в протоколе
---

## @description

### Контекст
В «Каркасе» появляется слой хранения. У каждого приложения свои хранилища: «Почтальон» хранит черновики сообщений, «Ярмарка» — id просмотренных товаров, «Волна» — историю прослушиваний. Правила у них разные: пустой черновик сохранять незачем, а один и тот же товар не должен попадать в список дважды.

Тимлид хочет общий протокол `Storage`, чтобы код библиотеки умел работать с любым хранилищем: сохранить пачку элементов, достать последний. Коллега уже начал протокол, но застрял: «Если написать `[String]`, "Ярмарка" не подойдёт. Если `[Int]` — не подойдёт "Почтальон". А угловые скобки у протокола Swift не принимает».

### Новое в Swift
У структуры и функции параметр типа пишется в угловых скобках. У протокола — по-другому: внутри него объявляют **связанный тип** словом `associatedtype`. Это заполнитель, который каждый соответствующий тип заполняет по-своему.

Пример: правила проверки полей в форме. Телефон проверяется как строка, возраст — как число, но идея одна: «получить значение и сказать, годится ли оно».

```swift
protocol Validator {
    associatedtype Value
    func isValid(_ value: Value) -> Bool
}
```

Теперь каждый тип, который соответствует `Validator`, сам решает, что такое его `Value`. Чаще всего Swift понимает это сам — по типам в методах:

```swift
struct PhoneValidator: Validator {
    func isValid(_ value: String) -> Bool {   // значит, Value — это String
        return value.count == 11
    }
}

struct AgeValidator: Validator {
    func isValid(_ value: Int) -> Bool {      // а здесь Value — это Int
        return value >= 14
    }
}
```

Если хочется сказать это явно, внутри типа пишут `typealias Value = String`. Слово `typealias` ты уже встречала в модуле про замыкания — оно даёт типу второе имя.

**Как работать с таким протоколом в обобщённом коде.** Параметр типа ограничивают протоколом, а к связанному типу обращаются через точку:

```swift
func invalidCount<V: Validator>(_ values: [V.Value], using validator: V) -> Int {
    return values.filter { !validator.isValid($0) }.count
}

invalidCount(["89001234567", "123"], using: PhoneValidator())   // 1
invalidCount([16, 9, 30], using: AgeValidator())                 // 1
```

`V.Value` читается как «тот тип значений, который выбрал этот валидатор». Для `PhoneValidator` это `String`, для `AgeValidator` — `Int`. Передать числа в проверку телефонов Swift не даст: типы не сойдутся.

> 💡 Связанный тип можно ограничить, как параметр типа: `associatedtype Value: Hashable`. Тогда заполнить его можно только `Hashable`-типом.

### Задача
1. Переделай протокол `Storage`. Вместо `String` в нём должен быть связанный тип `Item`. Требования протокола:
   - свойство `items` типа `[Item]` только для чтения — сохранённые элементы по порядку;
   - метод `save(_:)`, который принимает `Item`. Он меняет хранилище, поэтому `mutating`.
2. Структура `DraftStorage` соответствует `Storage`, её элементы — строки. Свойство `items` по умолчанию пустое. `save(_:)` добавляет текст в конец, но только если он не пустой.
3. Структура `ViewedProducts` соответствует `Storage`, её элементы — id товаров типа `Int`. `items` по умолчанию пустое. `save(_:)` добавляет id в конец, только если такого id ещё нет.
4. Обобщённая функция `saveAll(_:to:)` для любого хранилища: первый параметр — массив элементов этого хранилища (без метки), второй — само хранилище как `inout`. Сохраняет элементы по одному, через `save(_:)`, чтобы сработали правила хранилища.
5. Обобщённая функция `lastSaved(in:)` для любого хранилища — возвращает последний сохранённый элемент или `nil`, если хранилище пустое.

Проверка подключит к твоему протоколу и своё хранилище.

### Пример
```swift
var drafts = DraftStorage()
saveAll(["Созвон в 18:00", "", "Купи хлеб"], to: &drafts)
drafts.items              // ["Созвон в 18:00", "Купи хлеб"] — пустой пропущен
lastSaved(in: drafts)     // "Купи хлеб"

var viewed = ViewedProducts()
saveAll([501, 502, 501], to: &viewed)
viewed.items              // [501, 502]
lastSaved(in: ViewedProducts())   // nil
```

## @starter
```swift
// 1. Черновой протокол: годится только для строк.
//    Сделай тип элементов заполнителем Item
protocol Storage {
    var items: [String] { get }
    mutating func save(_ item: String)
}

// 2. Черновики: элементы — строки, пустые не сохраняются


// 3. Просмотренные товары: элементы — id (Int), без повторов


// 4. Сохранить несколько элементов в любое хранилище


// 5. Последний сохранённый элемент любого хранилища

```

## @solution
```swift
// 1. Черновой протокол: годится только для строк.
//    Сделай тип элементов заполнителем Item
protocol Storage {
    associatedtype Item
    var items: [Item] { get }
    mutating func save(_ item: Item)
}

// 2. Черновики: элементы — строки, пустые не сохраняются
struct DraftStorage: Storage {
    var items: [String] = []

    mutating func save(_ item: String) {
        if !item.isEmpty {
            items.append(item)
        }
    }
}

// 3. Просмотренные товары: элементы — id (Int), без повторов
struct ViewedProducts: Storage {
    var items: [Int] = []

    mutating func save(_ item: Int) {
        if !items.contains(item) {
            items.append(item)
        }
    }
}

// 4. Сохранить несколько элементов в любое хранилище
func saveAll<S: Storage>(_ newItems: [S.Item], to storage: inout S) {
    for item in newItems {
        storage.save(item)
    }
}

// 5. Последний сохранённый элемент любого хранилища
func lastSaved<S: Storage>(in storage: S) -> S.Item? {
    return storage.items.last
}
```

## @tests
```swift
var __t_drafts = DraftStorage()
__eq("Черновики: новое хранилище пустое", __t_drafts.items, [])
__t_drafts.save("Созвон в 18:00")
__t_drafts.save("")
__eq("Черновики: пустой текст не сохраняется", __t_drafts.items, ["Созвон в 18:00"], hint: "В save(_:) у DraftStorage добавляй текст, только если он не пустой")
var __t_sameDrafts = DraftStorage()
__t_sameDrafts.save("Купи хлеб")
__t_sameDrafts.save("Купи хлеб")
__eq("Черновики: одинаковые тексты допустимы", __t_sameDrafts.items, ["Купи хлеб", "Купи хлеб"], hint: "Правило «без повторов» — только у ViewedProducts. Черновики могут повторяться")

var __t_viewed = ViewedProducts()
__t_viewed.save(501)
__t_viewed.save(502)
__t_viewed.save(501)
__eq("Просмотренные: повтор id не сохраняется", __t_viewed.items, [501, 502], hint: "В save(_:) у ViewedProducts добавляй id, только если его ещё нет в items")

var __t_drafts2 = DraftStorage()
saveAll(["Привет", "", "Купи хлеб", ""], to: &__t_drafts2)
__eq("saveAll с черновиками: сработало правило про пустые", __t_drafts2.items, ["Привет", "Купи хлеб"], hint: "saveAll должна вызывать save(_:) для каждого элемента — тогда сработают правила конкретного хранилища")
saveAll([], to: &__t_drafts2)
__eq("saveAll с пустым массивом ничего не меняет", __t_drafts2.items, ["Привет", "Купи хлеб"])

var __t_viewed2 = ViewedProducts()
saveAll([501, 502, 501, 503, 502], to: &__t_viewed2)
__eq("saveAll с просмотренными: повторы отброшены", __t_viewed2.items, [501, 502, 503])

__eq("lastSaved: последний черновик", lastSaved(in: __t_drafts2), "Купи хлеб")
__eq("lastSaved: последний просмотренный товар", lastSaved(in: __t_viewed2), 503)
let __t_noId: Int? = nil
__eq("lastSaved: пустое хранилище — nil", lastSaved(in: ViewedProducts()), __t_noId, hint: "Если в хранилище ничего нет, верни nil")

let __t_storages: [any Storage] = [DraftStorage(), ViewedProducts()]
__eq("DraftStorage и ViewedProducts соответствуют протоколу Storage", __t_storages.count, 2)

struct __t_Event: Equatable {
    let title: String
    let minute: Int
}
struct __t_EventLog: Storage {
    var items: [__t_Event] = []
    mutating func save(_ item: __t_Event) {
        items.append(__t_Event(title: item.title.uppercased(), minute: item.minute))
    }
}
var __t_log = __t_EventLog()
saveAll([__t_Event(title: "вход", minute: 3), __t_Event(title: "оплата", minute: 7)], to: &__t_log)
__eq("Хранилище проверки (элементы — структура): saveAll сохранил оба события через save", __t_log.items.map { $0.title }, ["ВХОД", "ОПЛАТА"], hint: "Протокол должен подходить любому хранилищу, а saveAll — сохранять элементы именно методом save(_:), а не добавлять их напрямую")
__eq("Хранилище проверки: lastSaved вернул последнее событие", lastSaved(in: __t_log), __t_Event(title: "ОПЛАТА", minute: 7))
let __t_noEvent: __t_Event? = nil
__eq("Хранилище проверки: lastSaved для пустого — nil", lastSaved(in: __t_EventLog()), __t_noEvent)
```

## @rules
- must: /associatedtype\s+Item\b/ :: В протоколе `Storage` объяви связанный тип: `associatedtype Item`.
- mustnot: /var\s+items\s*:\s*\[\s*String\s*\]\s*\{\s*get/ :: В протоколе свойство `items` должно иметь тип `[Item]`, а не `[String]` — иначе протокол снова подходит только для строк.
- must: /func\s+saveAll\s*<\s*\w+\s*:\s*Storage\s*>/ :: Объяви `saveAll` обобщённой: `func saveAll<S: Storage>(...)`.
- must: /func\s+lastSaved\s*<\s*\w+\s*:\s*Storage\s*>/ :: Объяви `lastSaved` обобщённой: `func lastSaved<S: Storage>(...)`.

## @hint1
Начни с протокола. Первой строкой внутри объяви связанный тип `Item`. Потом в двух требованиях замени `String` на `Item`: свойство становится массивом `Item`, а метод принимает `Item`.

Две структуры устроены одинаково: переменная `items` с пустым массивом по умолчанию и `mutating`-метод `save`. Разница только в типе и правиле. Черновики — массив строк, метод принимает строку и добавляет её, если она не пустая. Просмотренные товары — массив чисел, метод принимает число и добавляет его, если его ещё нет в массиве. Писать `typealias` не обязательно: Swift сам поймёт тип `Item` по объявлению `items` и `save`.

Функции. Обе обобщённые, параметр типа ограничен протоколом `Storage`. В `saveAll` первый параметр — массив элементов именно этого хранилища: к связанному типу обращаются через точку после параметра типа. Второй параметр — хранилище с пометкой `inout`, ведь его нужно изменить. Внутри — цикл, который вызывает `save` для каждого элемента.

`lastSaved` возвращает опционал от связанного типа. Последний элемент массива ты умеешь доставать одним свойством.

## @hint2
Протокол со связанным типом выглядит так:

```swift
protocol Storage {
    associatedtype Item
    var items: [Item] { get }
    mutating func save(_ item: Item)
}
```

А в обобщённой функции к связанному типу обращаются через параметр типа:

```swift
func lastSaved<S: Storage>(in storage: S) -> S.Item? {
    // последний элемент storage.items
}
```

## @hint3
Протокол и одно хранилище готовы. Заполни пропуски:

```swift
struct ViewedProducts: Storage {
    var items: [Int] = []

    mutating func save(_ item: Int) {
        if ___ {
            items.append(item)
        }
    }
}

func saveAll<S: Storage>(_ newItems: ___, to storage: inout S) {
    for item in newItems {
        ___
    }
}

func lastSaved<S: Storage>(in storage: S) -> S.Item? {
    return storage.items.last
}
```

В первом пропуске — условие «такого id в массиве ещё нет». Во втором — тип «массив элементов хранилища `S`». В третьем — сохранение одного элемента через метод хранилища.

`DraftStorage` напиши по образцу `ViewedProducts`, только со строками и другим условием.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `associatedtype Item` говорит: «у каждого хранилища есть свой тип элементов, но какой — решает само хранилище». `DraftStorage` объявляет `items: [String]` и `save(_ item: String)` — Swift сопоставляет это с требованиями протокола и делает вывод: здесь `Item` — это `String`. У `ViewedProducts` по той же логике `Item` — это `Int`. Хранилище из проверки выбрало свою структуру событий — и тоже подошло.

В `saveAll<S: Storage>` запись `[S.Item]` связывает два параметра между собой: массив должен состоять именно из тех элементов, которые хранит переданное хранилище. Строки в `ViewedProducts` Swift не пропустит ещё до запуска. `inout` нужен потому, что функция меняет хранилище, а структуры передаются копиями.

**Почему `saveAll` вызывает `save`, а не добавляет элементы в `items` напрямую.** Во-первых, в протоколе `items` объявлено только для чтения (`{ get }`), так что снаружи его не изменить. Во-вторых, и это главное, у каждого хранилища свои правила: черновики отбрасывают пустой текст, товары — повторы. Библиотека их не знает и знать не должна. Она просто вызывает `save`, а правила срабатывают сами.

**Почему у протокола не угловые скобки.** Угловые скобки означают «тип выбирает тот, кто пользуется». А связанный тип выбирает тот, кто реализует протокол: `DraftStorage` раз и навсегда хранит строки, и никто снаружи не может создать «`DraftStorage` с числами».

**Типичные ошибки:**

- в протоколе осталось `[String]` — `ViewedProducts` не сможет ему соответствовать;
- в `saveAll` написано `[Item]` вместо `[S.Item]` — снаружи протокола Swift не знает отдельного типа `Item`;
- забыт `inout` — Swift скажет, что параметр функции менять нельзя;
- в `ViewedProducts` проверка повтора перепутана: `if items.contains(item)` добавляет только то, что уже было.
