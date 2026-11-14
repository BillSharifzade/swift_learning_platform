---
title: Репозиторий
concept: Итог модуля — обобщённый тип, ограничения, associatedtype, where
---

## @description

### Контекст
Финальная задача модуля — сердце «Каркаса». Каждому приложению студии нужно место, где живут его сущности: заказы в «Ярмарке», чаты в «Почтальоне», плейлисты в «Волне». У каждой сущности есть `id`. Её нужно уметь сохранить, найти, удалить и обновить по свежим данным с сервера.

Такое место называют **репозиторием**. Тимлид ставит задачу: «Один `Repository` на все приложения. Он не знает, что хранит, — знает только, что у каждой сущности есть `id`. Данные он получает из источника: сервера, файла, тестовых данных — тоже любого. А если сущности умеют сравниваться, пусть репозиторий умеет отдавать их по порядку».

### Что пригодится
Нового в этой задаче нет — только инструменты модуля:

- **Обобщённый тип с ограничением**: `struct Cache<Value>`, `struct LimitedStore<Key: Hashable, Value>`. У `Identifiable`-типа тип id записывается как `Entity.ID`, и id можно сравнивать через `==`.
- **Связанный тип с ограничением**: `associatedtype Item: Hashable` — заполнить его можно только подходящим типом.
- **Обобщённый метод со своим параметром типа**, как `map<NewPayload>` в обёртке ответа.
- **`where`, связывающее типы.** В задаче про `ListSection` ты писала `where Item == Int`. Так же можно потребовать, чтобы связанный тип протокола совпадал с параметром типа структуры. Вот плейлист, который забирает треки из хранилища, — но только из хранилища с треками того же типа:

```swift
struct Playlist<Track> {
    var tracks: [Track] = []

    mutating func importTracks<S: Storage>(from storage: S) where S.Item == Track {
        tracks += storage.items
    }
}
```

- **Условное расширение**: `extension ListSection where Item: Identifiable { ... }`.
- **Методы массива с замыканиями**: `contains(where:)`, `first(where:)`, `filter`, `map`, `sorted()`.

Для «заменить элемент на том же месте» удобен `map`: каждый элемент с нужным id меняется на новый, остальные остаются как были.

```swift
statuses = statuses.map { $0.chatId == fresh.chatId ? fresh : $0 }
```

### Задача
1. Протокол `DataSource` — источник данных. Связанный тип `Entity` с ограничением `Identifiable`. Требование: метод `fetchAll()`, который возвращает `[Entity]`.
2. Обобщённая структура `Repository` с параметром типа `Entity`, ограниченным `Identifiable`:
   - свойство `items` типа `[Entity]`, по умолчанию пустой массив, — сущности в порядке добавления;
   - вычисляемое свойство `count` типа `Int`;
   - метод `save(_:)`: если сущность с таким же `id` уже есть — заменяет её **на том же месте**; если нет — добавляет в конец;
   - метод `find(id:)`: принимает `Entity.ID`, возвращает `Entity?` — сущность с этим id или `nil`;
   - метод `delete(id:)`: удаляет сущность с этим id и возвращает `Bool` — `true`, если было что удалить, иначе `false`;
   - обобщённый метод `sync(from:)` с параметром типа для источника, ограниченным `DataSource`, и условием `where`: сущности источника того же типа, что и сущности репозитория. Сохраняет через `save(_:)` всё, что вернул `fetchAll()`, по порядку. Возвращает `Int` — сколько сущностей было новыми, то есть добавились, а не заменили старые.
3. Расширение `Repository` с условием «`Entity` соответствует `Comparable`». В нём метод `sorted()`, который возвращает `[Entity]` — все сущности по возрастанию.

Проверка создаст репозитории для своих структур с числовыми и строковыми id и подключит свои источники данных.

### Пример
```swift
// Order: Identifiable, у него id и сумма. OrdersServer: DataSource, возвращает заказы 1, 2 и 3
var orders = Repository<Order>()
orders.save(Order(id: 1, total: 990))
orders.save(Order(id: 1, total: 1200))   // заменили заказ 1
orders.count                             // 1

orders.sync(from: OrdersServer())        // 2 — заказы 2 и 3 новые, заказ 1 обновлён
orders.find(id: 3)?.total                // сумма заказа 3
orders.delete(id: 2)                     // true
orders.delete(id: 2)                     // false — уже удалён
```

## @starter
```swift
// 1. Источник данных: сервер, файл или тестовые данные.
//    Тип сущностей выбирает сам источник
protocol DataSource {

}

// 2. Репозиторий для сущностей любого Identifiable-типа.
//    Добавь параметр типа Entity
struct Repository {
    // Сущности в порядке добавления


    // Сколько сущностей в репозитории


    // Сохранить: заменить сущность с тем же id на том же месте или добавить в конец


    // Найти по id


    // Удалить по id: true, если было что удалить


    // Синхронизация: сохранить всё из источника и вернуть, сколько сущностей новых

}

// 3. Сортировка: только для сущностей, которые умеют сравниваться

```

## @solution
```swift
// 1. Источник данных: сервер, файл или тестовые данные.
//    Тип сущностей выбирает сам источник
protocol DataSource {
    associatedtype Entity: Identifiable
    func fetchAll() -> [Entity]
}

// 2. Репозиторий для сущностей любого Identifiable-типа.
//    Добавь параметр типа Entity
struct Repository<Entity: Identifiable> {
    // Сущности в порядке добавления
    var items: [Entity] = []

    // Сколько сущностей в репозитории
    var count: Int {
        items.count
    }

    // Сохранить: заменить сущность с тем же id на том же месте или добавить в конец
    mutating func save(_ entity: Entity) {
        if items.contains(where: { $0.id == entity.id }) {
            items = items.map { $0.id == entity.id ? entity : $0 }
        } else {
            items.append(entity)
        }
    }

    // Найти по id
    func find(id: Entity.ID) -> Entity? {
        return items.first(where: { $0.id == id })
    }

    // Удалить по id: true, если было что удалить
    mutating func delete(id: Entity.ID) -> Bool {
        let countBefore = items.count
        items = items.filter { $0.id != id }
        return items.count < countBefore
    }

    // Синхронизация: сохранить всё из источника и вернуть, сколько сущностей новых
    mutating func sync<Source: DataSource>(from source: Source) -> Int where Source.Entity == Entity {
        var added = 0
        for entity in source.fetchAll() {
            if find(id: entity.id) == nil {
                added += 1
            }
            save(entity)
        }
        return added
    }
}

// 3. Сортировка: только для сущностей, которые умеют сравниваться
extension Repository where Entity: Comparable {
    func sorted() -> [Entity] {
        return items.sorted()
    }
}
```

## @tests
```swift
struct __t_Order: Identifiable {
    let id: Int
    let total: Int
}
struct __t_OrdersServer: DataSource {
    let orders: [__t_Order]
    func fetchAll() -> [__t_Order] {
        return orders
    }
}

var __t_repo = Repository<__t_Order>()
__eq("Новый репозиторий пуст", __t_repo.count, 0)
__t_repo.save(__t_Order(id: 1, total: 990))
__t_repo.save(__t_Order(id: 2, total: 450))
__t_repo.save(__t_Order(id: 3, total: 3200))
__eq("save: три разных заказа — count = 3", __t_repo.count, 3)
__eq("save: заказы в порядке добавления", __t_repo.items.map { $0.id }, [1, 2, 3], hint: "Новая сущность добавляется в конец items")

__t_repo.save(__t_Order(id: 2, total: 500))
__eq("save: заказ с тем же id заменён, а не добавлен", __t_repo.count, 3, hint: "Если сущность с таким id уже есть, её нужно заменить, а не добавить вторую")
__eq("save: заменённый заказ остался на своём месте", __t_repo.items.map { $0.id }, [1, 2, 3], hint: "Замена происходит на том же месте: порядок items не меняется")
__eq("save: у заказа 2 новая сумма", __t_repo.items.map { $0.total }, [990, 500, 3200])

__eq("find: заказ 3 найден", __t_repo.find(id: 3)?.total, 3200)
__eq("find: заказа 42 нет — nil", __t_repo.find(id: 42) == nil, true, hint: "Если сущности с таким id нет, верни nil")
__eq("find: в пустом репозитории — nil", Repository<__t_Order>().find(id: 1) == nil, true)

__eq("delete: заказ 1 удалён — true", __t_repo.delete(id: 1), true)
__eq("delete: после удаления осталось 2", __t_repo.items.map { $0.id }, [2, 3])
__eq("delete: повторное удаление — false", __t_repo.delete(id: 1), false, hint: "Если удалять нечего, верни false")
__eq("delete: удаление несуществующего не трогает остальные", __t_repo.count, 2)
var __t_emptyRepo = Repository<__t_Order>()
__eq("delete: из пустого репозитория — false", __t_emptyRepo.delete(id: 7), false)

let __t_server = __t_OrdersServer(orders: [__t_Order(id: 3, total: 3500), __t_Order(id: 4, total: 120), __t_Order(id: 5, total: 780)])
__eq("sync: два заказа новых, один обновлён — вернёт 2", __t_repo.sync(from: __t_server), 2, hint: "Считай только те сущности, которых до сохранения не было в репозитории")
__eq("sync: новые заказы добавлены в конец по порядку", __t_repo.items.map { $0.id }, [2, 3, 4, 5])
__eq("sync: заказ 3 обновился данными источника", __t_repo.find(id: 3)?.total, 3500, hint: "sync сохраняет каждую сущность через save — существующие заменяются")
__eq("sync: повторная синхронизация — новых нет", __t_repo.sync(from: __t_server), 0)
__eq("sync: пустой источник — 0 новых", __t_repo.sync(from: __t_OrdersServer(orders: [])), 0)
__eq("sync: пустой источник ничего не удалил", __t_repo.count, 4)

var __t_fresh = Repository<__t_Order>()
let __t_doubled = __t_OrdersServer(orders: [__t_Order(id: 8, total: 100), __t_Order(id: 8, total: 150), __t_Order(id: 9, total: 60)])
__eq("sync: id повторяется внутри источника — новым считается один раз", __t_fresh.sync(from: __t_doubled), 2, hint: "Проверяй «новый ли» перед каждым save: второй заказ с id 8 уже заменяет первый")
__eq("sync: из двух заказов с id 8 остался последний", __t_fresh.find(id: 8)?.total, 150)

struct __t_Note: Identifiable, Comparable {
    let id: String
    let title: String
    static func < (lhs: __t_Note, rhs: __t_Note) -> Bool {
        return lhs.title < rhs.title
    }
    static func == (lhs: __t_Note, rhs: __t_Note) -> Bool {
        return lhs.id == rhs.id && lhs.title == rhs.title
    }
}
struct __t_NotesFile: DataSource {
    func fetchAll() -> [__t_Note] {
        return [__t_Note(id: "n-2", title: "Список покупок"), __t_Note(id: "n-1", title: "Идеи для отпуска"), __t_Note(id: "n-3", title: "Аптечка в дорогу")]
    }
}
var __t_notes = Repository<__t_Note>()
__eq("Строковые id: sync из файла заметок — 3 новых", __t_notes.sync(from: __t_NotesFile()), 3, hint: "Репозиторий должен работать с любыми Identifiable-сущностями, в том числе со строковыми id")
__eq("Строковые id: find по id n-1", __t_notes.find(id: "n-1")?.title, "Идеи для отпуска")
__eq("sorted: заметки по возрастанию", __t_notes.sorted().map { $0.title }, ["Аптечка в дорогу", "Идеи для отпуска", "Список покупок"], hint: "sorted() возвращает все сущности по возрастанию — сравнение уже описано в самой сущности")
__eq("sorted: items при этом не изменился", __t_notes.items.map { $0.id }, ["n-2", "n-1", "n-3"], hint: "sorted() возвращает новый массив и не меняет порядок items")
__eq("sorted: пустой репозиторий", Repository<__t_Note>().sorted(), [])
```

## @rules
- must: /associatedtype\s+Entity\s*:\s*Identifiable/ :: В протоколе `DataSource` объяви связанный тип с ограничением: `associatedtype Entity: Identifiable`.
- must: /struct\s+Repository\s*<\s*Entity\s*:\s*Identifiable\s*>/ :: Объяви репозиторий с ограниченным параметром типа: `struct Repository<Entity: Identifiable>`.
- must: /func\s+sync\s*<\s*\w+\s*:\s*DataSource\s*>[^{]*where\s+\w+\.Entity\s*==\s*Entity/ :: У `sync` нужен свой параметр типа с ограничением `DataSource` и условие `where`, которое связывает типы: `where Source.Entity == Entity`.
- must: /extension\s+Repository\s+where\s+Entity\s*:\s*Comparable/ :: Метод `sorted()` добавь в расширение с условием: `extension Repository where Entity: Comparable`.

## @hint1
Иди по трём комментариям сверху вниз.

Протокол. Внутри — связанный тип `Entity` с ограничением через двоеточие и одно требование: метод без параметров, который возвращает массив сущностей.

Репозиторий. После имени — параметр типа `Entity` с тем же ограничением. Массив `items` с пустым значением по умолчанию и вычисляемое `count`.

`save` меняет массив, значит, `mutating`. Сначала спроси массив, есть ли в нём элемент с таким же `id`. Если есть — пересобери массив через `map`: элемент с совпадающим id заменяется новым, остальные остаются. Если нет — добавь в конец.

`find` — первый элемент, у которого `id` совпадает с переданным. Тип параметра — `Entity.ID`.

`delete` тоже `mutating`. Запомни количество до удаления, отфильтруй массив, оставив элементы с другим id, и верни, стало ли элементов меньше.

`sync` — метод со своим параметром типа, ограниченным протоколом-источником. После типа результата — `where` и равенство связанного типа источника и `Entity`. Внутри заведи счётчик, пройди по тому, что вернул источник. Перед сохранением каждой сущности проверь, есть ли она уже в репозитории: если `find` вернул `nil` — она новая. Потом сохрани её через `save`.

Последний шаг — расширение с условием «сущности сравниваются», в нём метод, который возвращает отсортированные `items`.

## @hint2
Самое непростое место — связь типов в `sync`. Выглядит она так:

```swift
mutating func sync<Source: DataSource>(from source: Source) -> Int where Source.Entity == Entity {
    var added = 0
    for entity in source.fetchAll() {
        // новая ли сущность? потом save
    }
    return added
}
```

А замена на том же месте — это `map` с тернарным оператором:

```swift
items = items.map { $0.id == entity.id ? entity : $0 }
```

## @hint3
Протокол и сортировка готовы. Заполни пропуски в репозитории:

```swift
protocol DataSource {
    associatedtype Entity: Identifiable
    func fetchAll() -> [Entity]
}

struct Repository<Entity: Identifiable> {
    var items: [Entity] = []

    var count: Int {
        items.count
    }

    mutating func save(_ entity: Entity) {
        if items.contains(where: { ___ }) {
            items = items.map { $0.id == entity.id ? entity : $0 }
        } else {
            items.append(entity)
        }
    }

    func find(id: Entity.ID) -> Entity? {
        return items.first(where: { $0.id == id })
    }

    mutating func delete(id: Entity.ID) -> Bool {
        let countBefore = items.count
        items = items.filter { ___ }
        return items.count < countBefore
    }

    mutating func sync<Source: DataSource>(from source: Source) -> Int where ___ {
        var added = 0
        for entity in source.fetchAll() {
            if find(id: entity.id) == nil {
                added += 1
            }
            save(entity)
        }
        return added
    }
}

extension Repository where Entity: Comparable {
    func sorted() -> [Entity] {
        return items.sorted()
    }
}
```

В первом пропуске — «у элемента тот же id, что у `entity`». Во втором — «у элемента другой id». В третьем — равенство связанного типа источника и типа сущностей репозитория.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `Repository<Entity: Identifiable>` знает о своих сущностях ровно одно: у каждой есть `id`. Этого хватает на всё. `save` ищет по id, чтобы решить, заменить или добавить. `find` и `delete` принимают `Entity.ID` — для заказов это `Int`, для заметок `String`, и репозиторию всё равно.

`DataSource` со связанным типом `Entity: Identifiable` описывает любой источник: сервер с заказами, файл с заметками, тестовые данные. Каждый источник сам решает, что возвращает.

**Главная связка — `where Source.Entity == Entity`.** Без неё `sync` принял бы любой источник, и Swift не позволил бы сохранить его сущности: вдруг источник возвращает заметки, а репозиторий хранит заказы? Условие говорит: «источник подходит, только если его сущности того же типа, что у репозитория». Ошибка «подключили не тот сервер» ловится ещё до запуска.

**Почему счётчик проверяется до `save`.** После сохранения сущность в репозитории уже есть, и `find` найдёт её всегда. Поэтому вопрос «новая ли?» задаётся до сохранения. Так правильно считаются и повторы внутри одного ответа: второй заказ с тем же id уже застанет первый и новым не будет. А сравнение `find(id:) == nil` работает для любой сущности, даже если она не `Equatable`.

**Почему `sorted()` в расширении.** Сортировать можно только то, что умеет сравниваться. Заказы из проверки не `Comparable` — у их репозитория метода нет, и это правильно. Заметки сравниваются — и у их репозитория `sorted()` появляется сам.

**Типичные ошибки:**

- `save` всегда добавляет в конец — после синхронизации появятся два заказа с одним id;
- замена через удаление и `append` — заказ переедет в конец, а порядок должен сохраниться;
- `added += 1` стоит после `save` с проверкой `find` — новых всегда окажется ноль;
- в `sync` нет `where` — Swift скажет, что не может передать сущность источника в `save`, потому что типы могут не совпасть.
