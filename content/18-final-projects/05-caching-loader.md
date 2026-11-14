---
title: Загрузчик с кэшем
concept: Итог курса — дженерики, actor, async/await, TaskGroup
---

## @description

### Контекст
Онлайн-кинотеатр «Кинозал» тормозит на главном экране. Аналитик принёс график: при каждом открытии приложение заново скачивает карточки фильмов, которые уже скачивало минуту назад. А когда одна и та же карточка стоит в двух подборках, её качают дважды одновременно.

Тимлид ставит задачу: «Нужен общий загрузчик с кэшем. Обобщённый: сегодня он грузит карточки фильмов, завтра — аватарки и рейтинги. Безопасный при одновременных вызовах — поэтому `actor`. И с тремя правилами: что уже скачано — берём из кэша; что качается прямо сейчас — не качаем второй раз, а ждём тот же запрос; пачку карточек грузим параллельно».

Настоящей сети в задаче нет: сервер изображает функция, которая отвечает с небольшой задержкой.

### Что пригодится
- **`actor`** защищает свои свойства: в каждый момент их меняет только один вызов. Снаружи к методам и свойствам актора обращаются через `await`.
- **Важная особенность актора.** Пока метод актора стоит на `await`, актор может начать обслуживать другой вызов. Поэтому проверка «в кэше пусто» и запись в кэш после `await` — это два разных момента. Между ними может прийти второй вызов с тем же ключом и тоже решить, что надо качать.
- **`Task { ... }`** запускает работу и сразу даёт ссылку на неё. Результат ждут через `try await task.value`, и ждать одну и ту же задачу могут сколько угодно вызовов.
- **`withTaskGroup`** запускает много дочерних задач параллельно. Результаты приходят в порядке готовности, поэтому вместе с результатом передают номер.
- **`defer { ... }`** выполняется при любом выходе из функции — и при `return`, и при ошибке.

Пример на других данных — актор с курсами валют и параллельная загрузка:

```swift
actor RatesStore {
    private var rates: [String: Int] = [:]
    private var pending: [String: Task<Int, Error>] = [:]

    func rate(for code: String) async throws -> Int {
        if let known = rates[code] {
            return known
        }
        // pending нужен, чтобы не скачивать один курс дважды
        let task = Task { try await downloadRate(code) }
        pending[code] = task
        defer { pending[code] = nil }
        let rate = try await task.value
        rates[code] = rate
        return rate
    }
}

func sizes(of files: [String]) async -> [Int] {
    await withTaskGroup(of: (Int, Int).self) { group in
        for (index, file) in files.enumerated() {
            group.addTask { (index, await fileSize(file)) }
        }
        var result = Array(repeating: 0, count: files.count)
        for await (index, size) in group {
            result[index] = size
        }
        return result
    }
}
```

### Задача
Объявление актора `CachingLoader<Key, Value>`, его свойства и `init` уже готовы. `fetch` — функция-«сервер», которую загрузчик получает при создании. Допиши всё, что помечено `TODO`.

1. `func value(for key: Key) async throws -> Value` — правила по порядку:
   - значение есть в `cache` — вернуть его, в сеть не ходить;
   - для этого ключа уже есть задача в `inFlight` — дождаться её результата и вернуть его;
   - иначе увеличить `networkRequests` на 1, запустить `Task`, который вызывает `fetch(key)`, и положить задачу в `inFlight`. Дождаться результата, сохранить его в `cache` и вернуть.
   
   Когда задача закончилась — успешно или с ошибкой, — её нужно убрать из `inFlight`. Если `fetch` бросил ошибку, она пробрасывается дальше, а в кэш ничего не попадает: следующий вызов попробует снова.
2. `func values(for keys: [Key]) async -> [Value?]` — грузит все ключи **параллельно** через `withTaskGroup`, каждый — методом из пункта 1. Результаты идут в том же порядке, что и `keys`. Если элемент загрузить не удалось, на его месте `nil`, остальные всё равно загружаются.
3. `var cachedCount: Int` — сколько значений лежит в кэше.
4. `func invalidate(_ key: Key)` — убирает значение ключа из кэша, чтобы в следующий раз оно скачалось заново.
5. Функция `movieShelf(ids:loader:)` — строки для полки фильмов на главном экране. Загружает карточки методом из пункта 2 и для каждой возвращает `Ирония судьбы (1975)`, а для незагрузившейся — `Фильм 99 недоступен` (с её `id`). Порядок — как в `ids`.

### Пример
```swift
let loader = CachingLoader { id in try await fetchMovie(id: id) }
try await loader.value(for: 1)            // MovieCard «Ирония судьбы»
try await loader.value(for: 1)            // то же, но из кэша
await loader.networkRequests              // 1

await movieShelf(ids: [2, 99, 1], loader: loader)
// ["Москва слезам не верит (1979)", "Фильм 99 недоступен", "Ирония судьбы (1975)"]
await loader.networkRequests              // 3: карточка 1 уже была в кэше
await loader.cachedCount                  // 2
```

## @starter
```swift
// Обобщённый загрузчик с кэшем. Подходит для любых ключей и значений
actor CachingLoader<Key: Hashable & Sendable, Value: Sendable> {
    private let fetch: @Sendable (Key) async throws -> Value   // «сервер»
    private var cache: [Key: Value] = [:]                      // уже скачанное
    private var inFlight: [Key: Task<Value, Error>] = [:]      // качается прямо сейчас
    private(set) var networkRequests = 0                       // сколько раз ходили в сеть

    init(fetch: @escaping @Sendable (Key) async throws -> Value) {
        self.fetch = fetch
    }

    // 1. Значение по ключу: кэш, потом идущая загрузка, потом новый запрос
    func value(for key: Key) async throws -> Value {
        // TODO
        return try await fetch(key)
    }

    // 2. Параллельная загрузка пачки. Порядок — как в keys, неудача — nil
    func values(for keys: [Key]) async -> [Value?] {
        // TODO
        return []
    }

    // 3. Сколько значений в кэше
    var cachedCount: Int {
        // TODO
        return 0
    }

    // 4. Забыть значение ключа
    func invalidate(_ key: Key) {
        // TODO
    }
}

// Карточка фильма
struct MovieCard: Sendable, Equatable {
    let id: Int
    let title: String
    let year: Int
}

enum CatalogError: Error {
    case notFound(id: Int)
}

// Имитация сервера: отвечает через 20 мс
let serverMovies = [
    1: MovieCard(id: 1, title: "Ирония судьбы", year: 1975),
    2: MovieCard(id: 2, title: "Москва слезам не верит", year: 1979),
    3: MovieCard(id: 3, title: "Кин-дза-дза!", year: 1986),
    4: MovieCard(id: 4, title: "Летят журавли", year: 1957)
]

func fetchMovie(id: Int) async throws -> MovieCard {
    try await Task.sleep(for: .milliseconds(20))
    guard let movie = serverMovies[id] else {
        throw CatalogError.notFound(id: id)
    }
    return movie
}

// 5. Строки полки фильмов: "Ирония судьбы (1975)" или "Фильм 99 недоступен"
func movieShelf(ids: [Int], loader: CachingLoader<Int, MovieCard>) async -> [String] {
    // TODO
    return []
}

// Главный экран Билола: две подборки, в которых есть общие фильмы
let loader = CachingLoader { id in try await fetchMovie(id: id) }
print("Новинки:")
for line in await movieShelf(ids: [1, 2, 3, 1], loader: loader) {
    print(line)
}
print("Классика:")
for line in await movieShelf(ids: [4, 1, 99], loader: loader) {
    print(line)
}
print("Запросов в сеть: \(await loader.networkRequests)")
print("В кэше: \(await loader.cachedCount)")
```

## @solution
```swift
// Обобщённый загрузчик с кэшем. Подходит для любых ключей и значений
actor CachingLoader<Key: Hashable & Sendable, Value: Sendable> {
    private let fetch: @Sendable (Key) async throws -> Value   // «сервер»
    private var cache: [Key: Value] = [:]                      // уже скачанное
    private var inFlight: [Key: Task<Value, Error>] = [:]      // качается прямо сейчас
    private(set) var networkRequests = 0                       // сколько раз ходили в сеть

    init(fetch: @escaping @Sendable (Key) async throws -> Value) {
        self.fetch = fetch
    }

    // 1. Значение по ключу: кэш, потом идущая загрузка, потом новый запрос
    func value(for key: Key) async throws -> Value {
        if let cached = cache[key] {
            return cached
        }
        if let running = inFlight[key] {
            return try await running.value
        }
        networkRequests += 1
        let task = Task { try await fetch(key) }
        inFlight[key] = task
        defer { inFlight[key] = nil }
        let value = try await task.value
        cache[key] = value
        return value
    }

    // 2. Параллельная загрузка пачки. Порядок — как в keys, неудача — nil
    func values(for keys: [Key]) async -> [Value?] {
        await withTaskGroup(of: (Int, Value?).self) { group in
            for (index, key) in keys.enumerated() {
                group.addTask {
                    (index, try? await self.value(for: key))
                }
            }
            var results = [Value?](repeating: nil, count: keys.count)
            for await (index, value) in group {
                results[index] = value
            }
            return results
        }
    }

    // 3. Сколько значений в кэше
    var cachedCount: Int {
        cache.count
    }

    // 4. Забыть значение ключа
    func invalidate(_ key: Key) {
        cache[key] = nil
    }
}

// Карточка фильма
struct MovieCard: Sendable, Equatable {
    let id: Int
    let title: String
    let year: Int
}

enum CatalogError: Error {
    case notFound(id: Int)
}

// Имитация сервера: отвечает через 20 мс
let serverMovies = [
    1: MovieCard(id: 1, title: "Ирония судьбы", year: 1975),
    2: MovieCard(id: 2, title: "Москва слезам не верит", year: 1979),
    3: MovieCard(id: 3, title: "Кин-дза-дза!", year: 1986),
    4: MovieCard(id: 4, title: "Летят журавли", year: 1957)
]

func fetchMovie(id: Int) async throws -> MovieCard {
    try await Task.sleep(for: .milliseconds(20))
    guard let movie = serverMovies[id] else {
        throw CatalogError.notFound(id: id)
    }
    return movie
}

// 5. Строки полки фильмов: "Ирония судьбы (1975)" или "Фильм 99 недоступен"
func movieShelf(ids: [Int], loader: CachingLoader<Int, MovieCard>) async -> [String] {
    let cards = await loader.values(for: ids)
    var lines: [String] = []
    for (index, card) in cards.enumerated() {
        if let card {
            lines.append("\(card.title) (\(card.year))")
        } else {
            lines.append("Фильм \(ids[index]) недоступен")
        }
    }
    return lines
}

// Главный экран Билола: две подборки, в которых есть общие фильмы
let loader = CachingLoader { id in try await fetchMovie(id: id) }
print("Новинки:")
for line in await movieShelf(ids: [1, 2, 3, 1], loader: loader) {
    print(line)
}
print("Классика:")
for line in await movieShelf(ids: [4, 1, 99], loader: loader) {
    print(line)
}
print("Запросов в сеть: \(await loader.networkRequests)")
print("В кэше: \(await loader.cachedCount)")
```

## @tests
```swift
enum __t_NetError: Error {
    case offline
}

// Тестовый сервер: считает вызовы и одновременные запросы, отвечает через 30 мс
actor __t_Server {
    private(set) var calls = 0
    private(set) var active = 0
    private(set) var maxActive = 0
    private var offline = false
    private let broken: Set<String>

    init(broken: Set<String> = []) {
        self.broken = broken
    }

    func setOffline(_ value: Bool) {
        offline = value
    }

    func handle(_ key: String) async throws -> Int {
        calls += 1
        active += 1
        maxActive = max(maxActive, active)
        try? await Task.sleep(for: .milliseconds(30))
        active -= 1
        if offline || broken.contains(key) {
            throw __t_NetError.offline
        }
        return key.count * 10
    }
}

func __t_loader(_ server: __t_Server) -> CachingLoader<String, Int> {
    CachingLoader { key in try await server.handle(key) }
}

do {
    let server = __t_Server()
    let loader = __t_loader(server)
    __eq("Первый запрос: значение от сервера", try await loader.value(for: "poster"), 60, hint: "Если в кэше пусто и ничего не качается, вызови fetch(key) через Task и верни результат")
    __eq("Повторный запрос того же ключа: то же значение", try await loader.value(for: "poster"), 60)
    __eq("Повторный запрос берётся из кэша: в сеть ходили 1 раз", await loader.networkRequests, 1, hint: "После загрузки сохрани значение в cache, а в начале value(for:) сначала проверь cache")
    __eq("Сервер тоже получил ровно 1 запрос", await server.calls, 1, hint: "Если значение есть в cache, fetch вызывать не нужно")
    __eq("Новый ключ: значение и второй запрос", "\(try await loader.value(for: "logo")) / \(await loader.networkRequests)", "40 / 2")
    __eq("В кэше 2 значения", await loader.cachedCount, 2, hint: "cachedCount — количество элементов в cache")
    await loader.invalidate("poster")
    __eq("После invalidate в кэше 1 значение", await loader.cachedCount, 1, hint: "invalidate убирает ключ из cache: cache[key] = nil")
    _ = try await loader.value(for: "poster")
    __eq("После invalidate ключ скачивается заново", await loader.networkRequests, 3)
} catch {
    __fail("Обычная загрузка", "value(for:) бросил ошибку там, где сервер отвечает: \(error)")
}

do {
    let server = __t_Server()
    let loader = __t_loader(server)
    async let first = loader.value(for: "trailer")
    async let second = loader.value(for: "trailer")
    async let third = loader.value(for: "trailer")
    let results = try await [first, second, third]
    __eq("Три одновременных запроса одного ключа: одно значение", results, [70, 70, 70])
    __eq("Три одновременных запроса одного ключа: в сеть 1 раз", await loader.networkRequests, 1, hint: "Пока первый запрос ждёт ответа, второй вызов тоже видит пустой кэш. Храни Task в inFlight до await и отдавай её результат следующим вызовам")
    __eq("Сервер получил 1 запрос, а не 3", await server.calls, 1)
} catch {
    __fail("Одновременные запросы", "value(for:) бросил ошибку: \(error)")
}

do {
    let server = __t_Server()
    await server.setOffline(true)
    let loader = __t_loader(server)
    do {
        _ = try await loader.value(for: "news")
        __fail("Ошибка сервера пробрасывается", "Сервер не ответил, а value(for:) вернул значение")
    } catch {
        __pass("Ошибка сервера пробрасывается")
    }
    __eq("После ошибки в кэше пусто", await loader.cachedCount, 0)
    await server.setOffline(false)
    __eq("Сеть вернулась: новая попытка успешна", try await loader.value(for: "news"), 40, hint: "Убирай задачу из inFlight при любом исходе, например через defer. Иначе следующий вызов получит старую ошибку")
    __eq("После ошибки была новая попытка: запросов 2", await loader.networkRequests, 2)
} catch {
    __fail("Повтор после ошибки", "Когда сервер снова работает, value(for:) должен вернуть значение, а бросил \(error). Похоже, неудачная задача осталась в inFlight: убирай её при любом исходе через defer")
}

do {
    let server = __t_Server(broken: ["oops"])
    let loader = __t_loader(server)
    __eq("Пачка: порядок как в keys, повтор ключа — то же значение", await loader.values(for: ["a", "bbb", "a", "cc"]), [10, 30, 10, 20], hint: "Передавай в группу пару (номер, значение) и раскладывай результаты по номерам")
    __eq("Пачка с повтором ключа: 3 запроса в сеть", await loader.networkRequests, 3, hint: "Каждый элемент пачки грузи через value(for:): тогда кэш и защита от двойных запросов работают и здесь")
    __eq("Пачка: неудачный элемент — nil, остальные загружены", await loader.values(for: ["dddd", "oops", "a"]), [40, nil, 10], hint: "Ошибку одного элемента преврати в nil через try?, остальные элементы должны загрузиться")
    __eq("Пустая пачка — пустой массив", await loader.values(for: []), [])
}

var __t_maxActive = 0
for _ in 1...3 {
    if __t_maxActive >= 2 {
        break
    }
    let server = __t_Server()
    _ = await __t_loader(server).values(for: ["a", "bb", "ccc", "dddd", "eeeee"])
    __t_maxActive = max(__t_maxActive, await server.maxActive)
}
__ok("Пачка грузится параллельно, а не по очереди", __t_maxActive >= 2, hint: "Запускай загрузки через withTaskGroup и group.addTask, а не циклом с await по одной")

let __t_movies = CachingLoader { id in try await fetchMovie(id: id) }
let __t_shelf = await movieShelf(ids: [3, 77, 4, 3], loader: __t_movies)
__eq("Полка фильмов: строки по порядку", __t_shelf, ["Кин-дза-дза! (1986)", "Фильм 77 недоступен", "Летят журавли (1957)", "Кин-дза-дза! (1986)"], hint: "Для карточки — название и год в скобках, для nil — Фильм, id из ids по тому же номеру и недоступен")
__eq("Полка фильмов грузит через загрузчик: 3 запроса", await __t_movies.networkRequests, 3, hint: "Карточки получай через loader.values(for: ids)")
__eq("Пустая полка", await movieShelf(ids: [], loader: __t_movies), [])
```

## @rules
- must: /with(Throwing)?TaskGroup/ :: Пачку нужно грузить параллельно через `withTaskGroup`.
- must: /inFlight\s*\[\s*key\s*\]\s*=/ :: Запоминай идущую загрузку: `inFlight[key] = task`. Иначе одновременные вызовы скачают одно и то же дважды.

## @hint1
Начни с `value(for:)` — на нём держится всё остальное. Три проверки по порядку. Есть ли значение в `cache`? Верни его. Есть ли для ключа задача в `inFlight`? Дождись её результата через `try await` и верни. Ни того, ни другого — увеличь счётчик запросов, создай `Task`, внутри которого вызывается `fetch(key)`, и **сразу**, до любого `await`, положи задачу в `inFlight`. Тогда второй вызов, пришедший во время ожидания, найдёт её и не пойдёт в сеть. Чтобы задача убралась из `inFlight` при любом исходе, используй `defer`. Затем дождись результата, положи его в `cache` и верни.

`values(for:)` — группа задач. Для каждого ключа с его номером добавь в группу задачу, которая возвращает пару «номер и значение». Значение получай методом `value(for:)` через `try?` — ошибка превратится в `nil`. Заранее создай массив нужной длины из `nil` и раскладывай результаты по номерам.

`cachedCount` и `invalidate` — по одной строке про словарь `cache`.

`movieShelf` — получи массив карточек из загрузчика, пройди по нему с номерами и для каждой карточки выбери одну из двух строк.

## @hint2
Главный приём — запомнить задачу до ожидания:

```swift
networkRequests += 1
let task = Task { try await fetch(key) }
inFlight[key] = task
defer { inFlight[key] = nil }
let value = try await task.value
cache[key] = value
return value
```

Группа задач с номерами:

```swift
await withTaskGroup(of: (Int, Value?).self) { group in
    for (index, key) in keys.enumerated() {
        group.addTask {
            (index, try? await self.value(for: key))
        }
    }
    // собери результаты по номерам
}
```

## @hint3
Заполни пропуски:

```swift
func value(for key: Key) async throws -> Value {
    if let cached = cache[key] {
        return cached
    }
    if let running = inFlight[key] {
        return ___
    }
    networkRequests += 1
    let task = Task { try await fetch(key) }
    inFlight[key] = task
    defer { inFlight[key] = nil }
    let value = try await task.value
    cache[key] = value
    return value
}

func values(for keys: [Key]) async -> [Value?] {
    await withTaskGroup(of: (Int, Value?).self) { group in
        for (index, key) in keys.enumerated() {
            group.addTask {
                (index, try? await self.value(for: key))
            }
        }
        var results = [Value?](repeating: nil, count: keys.count)
        for await (index, value) in group {
            ___
        }
        return results
    }
}

func movieShelf(ids: [Int], loader: CachingLoader<Int, MovieCard>) async -> [String] {
    let cards = await loader.values(for: ids)
    var lines: [String] = []
    for (index, card) in cards.enumerated() {
        if let card {
            lines.append("\(card.title) (\(card.year))")
        } else {
            lines.append(___)
        }
    }
    return lines
}
```

В первом пропуске — ожидание результата уже идущей задачи. Во втором — запись значения в `results` по номеру. В третьем — строка про недоступный фильм с `id` из `ids` по тому же номеру.

## @hint4
Вот готовое решение:

{{solution}}

**Зачем `inFlight`, если есть кэш.** Кэш заполняется только после ответа сервера, а ответ приходит не сразу. Пока первый вызов стоит на `await`, актор уже обслуживает второй — и тот видит пустой кэш. Без `inFlight` он тоже пошёл бы в сеть. Поэтому задача кладётся в `inFlight` до ожидания: второй вызов найдёт её и просто дождётся того же результата. Проверка запускает три одновременных запроса одного ключа и считает, сколько раз сработал сервер.

**Зачем `defer`.** Задачу нужно убрать из `inFlight` и после успеха, и после ошибки. `defer` срабатывает при любом выходе из функции. Если забыть про ошибочный случай, неудачная задача навсегда останется в `inFlight`, и каждый следующий вызов будет получать её старую ошибку.

**Почему загрузчик — актор и дженерик.** Актор не даст двум вызовам одновременно менять `cache` и `inFlight`. А параметры `Key` и `Value` позволяют один и тот же код использовать для фильмов, аватарок и чего угодно ещё — проверка запускает его со строковыми ключами и числами.

**Почему в группе номер.** Дочерние задачи заканчиваются в случайном порядке: какая карточка скачалась раньше, та и пришла первой. Номер позволяет разложить результаты ровно в порядке `keys`, и экран всегда показывает полку одинаково.

**Типичные ошибки:**

- `inFlight[key] = task` стоит после `try await task.value` — к этому моменту второй запрос уже ушёл;
- в группе каждая задача вызывает `fetch` напрямую, а не `value(for:)`, — кэш и защита от двойных запросов не работают;
- цикл `for key in keys { await ... }` вместо группы — карточки качаются по одной, и полка грузится в разы дольше;
- в `values(for:)` используется `try` без `?` — тогда одна неудачная карточка ломает всю полку.
