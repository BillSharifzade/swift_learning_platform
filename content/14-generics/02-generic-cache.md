---
title: Кэш
concept: Обобщённый тип — структура с параметром типа
---

## @description

### Контекст
Почти каждому приложению студии нужен кэш — место в памяти, где хранятся уже загруженные данные, чтобы не просить их у сервера второй раз. «Почтальон» кэширует профили собеседников, «Волна» — ссылки на обложки альбомов, «Монета» — курсы валют.

Сейчас у каждого приложения свой кэш, и все они похожи как близнецы: словарь, метод «сохранить», метод «достать». Тимлид просит сделать в «Каркасе» один общий кэш: «Ключ всегда строка, а значение — что угодно. И добавь счётчики попаданий и промахов: аналитики хотят знать, как часто кэш действительно выручает».

### Новое в Swift
В прошлой задаче параметр типа был у функции. Точно так же его можно объявить у **структуры** (и у класса, и у перечисления). Такой тип называют **обобщённым**.

Пример: поле в редакторе документа, которое помнит свои прошлые значения, чтобы изменение можно было отменить. Хранить в нём можно и заголовок, и сумму, и дату — что угодно:

```swift
struct Versioned<Value> {
    var current: Value
    var history: [Value] = []

    mutating func update(to newValue: Value) {
        history.append(current)
        current = newValue
    }
}
```

`<Value>` после имени объявляет параметр типа. Внутри структуры `Value` используется везде, где нужен «тип хранимого значения»: в свойствах, в параметрах методов, в результатах.

**Как создать экземпляр.** Если Swift может понять тип по аргументам, он подставит его сам:

```swift
var title = Versioned(current: "Черновик")   // Versioned<String>
title.update(to: "Отчёт за май")
print(title.current)    // Отчёт за май
print(title.history)    // ["Черновик"]

var limit = Versioned(current: 5000)        // Versioned<Int>
```

Если по аргументам тип не понять, его указывают в угловых скобках после имени:

```swift
var rate = Versioned<Double>(current: 0)
```

Без `<Double>` Swift решил бы, что `0` — это `Int`. Для пустого кэша угловые скобки обязательны: `Cache<String>()` — аргументов нет вообще, подсказать тип больше нечему.

**Каждая подстановка — отдельный тип.** `Versioned<String>` и `Versioned<Int>` — два разных типа, хоть и сделанных по одному чертежу. В `title` нельзя положить число, а в `limit` — текст. Обобщённый код гибкий при объявлении, но строгий при использовании.

> 💡 Автоматический инициализатор работает и у обобщённых структур. Если у свойства есть значение по умолчанию, при создании его можно не указывать.

### Задача
В редакторе есть заготовка структуры `Cache`. Сделай её обобщённой и допиши.

1. Объяви у `Cache` параметр типа `Value` — тип значений, которые хранит кэш.
2. Свойства:
   - `storage` типа `[String: Value]`, по умолчанию пустой словарь;
   - `hits` типа `Int` — сколько раз значение нашлось, по умолчанию `0`;
   - `misses` типа `Int` — сколько раз значения не оказалось, по умолчанию `0`.
3. Метод `save(_:for:)`: значение без метки, ключ-строка с меткой `for`. Кладёт значение в `storage`. Если по ключу уже что-то было, заменяет.
4. Метод `value(for:)` возвращает `Value?`. Если значение по ключу есть, увеличивает `hits` на 1 и возвращает его. Если нет — увеличивает `misses` на 1 и возвращает `nil`. Метод меняет счётчики, поэтому он `mutating`.
5. Метод `removeValue(for:)` удаляет значение по ключу. Счётчики не меняет.
6. Вычисляемое свойство `count` типа `Int` — сколько значений сейчас в кэше.

Проверка создаст кэш строк, кэш чисел и кэш структур — например, `Cache<String>()`.

### Пример
```swift
var covers = Cache<String>()
covers.save("cdn/sea.jpg", for: "album-17")
covers.value(for: "album-17")    // "cdn/sea.jpg", hits = 1
covers.value(for: "album-99")    // nil, misses = 1
covers.count                     // 1

var rates = Cache<Double>()
rates.save(92.5, for: "USD")
rates.removeValue(for: "USD")
rates.count                      // 0
```

## @starter
```swift
// Общий кэш «Каркаса»: ключ — строка, значение — любого типа
struct Cache {
    // 1. Хранилище и счётчики попаданий и промахов


    // 2. Сохранить значение по ключу


    // 3. Достать значение по ключу и обновить счётчики


    // 4. Удалить значение по ключу


    // 5. Сколько значений сейчас в кэше

}
```

## @solution
```swift
// Общий кэш «Каркаса»: ключ — строка, значение — любого типа
struct Cache<Value> {
    // 1. Хранилище и счётчики попаданий и промахов
    var storage: [String: Value] = [:]
    var hits = 0
    var misses = 0

    // 2. Сохранить значение по ключу
    mutating func save(_ value: Value, for key: String) {
        storage[key] = value
    }

    // 3. Достать значение по ключу и обновить счётчики
    mutating func value(for key: String) -> Value? {
        if let value = storage[key] {
            hits += 1
            return value
        }
        misses += 1
        return nil
    }

    // 4. Удалить значение по ключу
    mutating func removeValue(for key: String) {
        storage.removeValue(forKey: key)
    }

    // 5. Сколько значений сейчас в кэше
    var count: Int {
        storage.count
    }
}
```

## @tests
```swift
var __t_covers = Cache<String>()
__eq("Новый кэш пуст", __t_covers.count, 0)
__eq("У нового кэша hits = 0", __t_covers.hits, 0)
__eq("У нового кэша misses = 0", __t_covers.misses, 0)

__t_covers.save("cdn/sea.jpg", for: "album-17")
__t_covers.save("cdn/city.jpg", for: "album-21")
__eq("Кэш строк: после двух сохранений count = 2", __t_covers.count, 2)
__eq("Кэш строк: значение по ключу album-17", __t_covers.value(for: "album-17"), "cdn/sea.jpg")
__eq("Кэш строк: значение по ключу album-21", __t_covers.value(for: "album-21"), "cdn/city.jpg")
__eq("Кэш строк: два попадания — hits = 2", __t_covers.hits, 2, hint: "Каждый раз, когда value(for:) нашёл значение, hits увеличивается на 1")
__eq("Кэш строк: пока промахов нет — misses = 0", __t_covers.misses, 0)

let __t_none: String? = nil
__eq("Кэш строк: по неизвестному ключу — nil", __t_covers.value(for: "album-99"), __t_none)
__eq("Кэш строк: промах увеличил misses до 1", __t_covers.misses, 1, hint: "Если значения по ключу нет, misses увеличивается на 1")
__eq("Кэш строк: промах не изменил hits", __t_covers.hits, 2, hint: "При промахе hits меняться не должен")

__t_covers.save("cdn/sea-new.jpg", for: "album-17")
__eq("Кэш строк: повторное сохранение заменяет значение", __t_covers.value(for: "album-17"), "cdn/sea-new.jpg")
__eq("Кэш строк: повторное сохранение не добавляет запись", __t_covers.count, 2, hint: "Если ключ уже есть, значение заменяется, а не добавляется рядом")

__t_covers.removeValue(for: "album-21")
__eq("Кэш строк: после удаления count = 1", __t_covers.count, 1)
__eq("Кэш строк: удалённое значение больше не находится", __t_covers.value(for: "album-21"), __t_none)
__eq("Кэш строк: итоговые счётчики hits = 3, misses = 2", "\(__t_covers.hits)/\(__t_covers.misses)", "3/2", hint: "removeValue(for:) не должен трогать счётчики. Их меняет только value(for:)")
__t_covers.removeValue(for: "album-404")
__eq("Кэш строк: удаление несуществующего ключа ничего не ломает", __t_covers.count, 1)

var __t_rates = Cache<Double>()
__t_rates.save(92.5, for: "USD")
__t_rates.save(100.25, for: "EUR")
__eq("Кэш чисел (Double): курс USD", __t_rates.value(for: "USD"), 92.5)
__eq("Кэш чисел (Double): в кэше 2 курса", __t_rates.count, 2)
__eq("Кэш чисел (Double): у хранилища тип [String: Double]", __t_rates.storage, ["USD": 92.5, "EUR": 100.25], hint: "storage — это словарь [String: Value]. Для Cache<Double> он становится [String: Double]")

struct __t_Profile: Equatable {
    let login: String
    let status: String
}
var __t_profiles = Cache<__t_Profile>()
__t_profiles.save(__t_Profile(login: "bilol", status: "В сети"), for: "user-1")
__t_profiles.save(__t_Profile(login: "night_owl", status: "Был вчера"), for: "user-2")
__eq("Кэш структур проверки: профиль bilol", __t_profiles.value(for: "user-1"), __t_Profile(login: "bilol", status: "В сети"), hint: "Кэш должен хранить значения любого типа, в том числе структуры, которых нет в твоём коде")
__eq("Кэш структур проверки: статус night_owl", __t_profiles.value(for: "user-2")?.status, "Был вчера")
__eq("Кэш структур проверки: свои счётчики, независимые от других кэшей", "\(__t_profiles.hits)/\(__t_profiles.misses)", "2/0", hint: "У каждого экземпляра кэша свои hits и misses")

var __t_lists = Cache<[String]>()
__t_lists.save(["Море", "Осень"], for: "playlist-3")
__eq("Кэш массивов: Value может быть даже массивом", __t_lists.value(for: "playlist-3"), ["Море", "Осень"])
```

## @rules
- must: /struct\s+Cache\s*<\s*Value\s*>/ :: Объяви у `Cache` параметр типа `Value`: `struct Cache<Value>`.
- mustnot: /storage\s*:\s*\[\s*String\s*:\s*(String|Int|Double|Any)\s*\]/ :: Значения в `storage` должны иметь тип `Value`, а не конкретный тип: `[String: Value]`.

## @hint1
Первым делом сделай структуру обобщённой: после имени `Cache`, до фигурной скобки, объяви в угловых скобках параметр типа `Value`.

Теперь свойства. Хранилище — словарь, у которого ключи строки, а значения — типа `Value`. По умолчанию он пустой. Два счётчика — обычные целые числа, начинающиеся с нуля.

Метод сохранения меняет хранилище, поэтому он `mutating`. Значение принимает без метки, ключ — с меткой `for`. Внутри одна строка: запись в словарь по ключу.

Метод чтения возвращает опционал `Value?`. Достань значение из словаря через `if let`. Если получилось — увеличь `hits` и верни значение. После блока `if` увеличь `misses` и верни `nil`. Метод меняет счётчики — значит, тоже `mutating`.

Удаление — вызов метода словаря, который убирает значение по ключу. Количество — вычисляемое свойство, которое возвращает `count` словаря.

## @hint2
Начало обобщённой структуры и её свойства выглядят так:

```swift
struct Cache<Value> {
    var storage: [String: Value] = [:]
    var hits = 0
    var misses = 0
}
```

А метод, который принимает или возвращает значение кэша, использует `Value` как обычный тип:

```swift
mutating func save(_ value: Value, for key: String) {
    storage[key] = value
}
```

## @hint3
Каркас готов, осталось заполнить пропуски:

```swift
struct Cache<Value> {
    var storage: [String: Value] = [:]
    var hits = 0
    var misses = 0

    mutating func save(_ value: Value, for key: String) {
        storage[key] = value
    }

    mutating func value(for key: String) -> ___ {
        if let value = storage[key] {
            ___
            return value
        }
        misses += 1
        return nil
    }

    mutating func removeValue(for key: String) {
        storage.removeValue(forKey: key)
    }

    var count: Int {
        ___
    }
}
```

В первом пропуске — тип результата: значение кэша или ничего. Во втором — увеличение счётчика попаданий. В третьем — количество элементов словаря.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `struct Cache<Value>` — чертёж кэша с «дыркой» под тип значений. Когда приложение пишет `Cache<String>()`, Swift подставляет `String` на место `Value`: хранилище становится `[String: String]`, `save` принимает строку, `value(for:)` возвращает `String?`. Для `Cache<Double>` всё то же самое, только с `Double`. Код один, а кэшей — сколько угодно.

`Cache<String>()` создаётся без аргументов благодаря автоматическому инициализатору: у всех трёх свойств есть значения по умолчанию. А угловые скобки нужны потому, что аргументов нет — иначе Swift не узнал бы, какой тип подставить.

**Почему `value(for:)` возвращает `Value?`.** Ключа в кэше может не оказаться, и это нормальная ситуация: тогда приложение идёт за данными на сервер. Опционал честно передаёт этот исход. Обрати внимание: тип результата — тоже `Value`, только с вопросительным знаком. Параметр типа можно использовать в любой форме: `Value?`, `[Value]`, `[String: Value]`.

**Почему `value(for:)` — `mutating`.** Обычно чтение ничего не меняет. Но здесь метод ведёт статистику, а `hits` и `misses` — свойства структуры. Менять свойства структуры могут только методы с `mutating`.

**Типичные ошибки:**

- `storage: [String: String]` — кэш снова умеет хранить только строки, и проверка со структурами не соберётся;
- забыт `mutating` у `value(for:)` — Swift не даст изменить `hits` внутри метода;
- `misses += 1` написан до `if let` — тогда промах засчитывается даже при попадании;
- при создании написано `Cache()` без угловых скобок — Swift не сможет понять, что хранит кэш.
