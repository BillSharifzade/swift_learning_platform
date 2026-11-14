---
title: Кэш без гонок
concept: actor — защита общих данных от одновременного доступа
---

## @description

### Контекст
Чтобы не загружать один и тот же прогноз по десять раз, «Горизонт» хранит последние ответы сервера в **кэше** — памяти приложения «на всякий случай». Открыла главный экран — прогноз скачался и лёг в кэш. Перешла в список городов и вернулась — он берётся из кэша мгновенно.

Старый кэш был обычным классом, и в отчётах о сбоях время от времени появлялось падение где-то внутри словаря. А аналитики жаловались, что счётчик попаданий в кэш показывает меньше, чем должен. Тимлид объясняет: «Это гонка данных. Кэшем пользуются главный экран, виджет и загрузка списка городов, и всё это одновременно. Перепиши кэш на `actor`».

### Новое в Swift
Представь кассу в магазине. Кассир обслуживает покупателей **по одному**: пока он пробивает чек одному, остальные стоят в очереди. Никто не лезет в кассу, пока там считают деньги. А теперь представь, что к одной кассе подходят сразу трое и каждый сам отсчитывает себе сдачу. Деньги перепутаются очень быстро.

С данными происходит то же самое. Вот счётчик просмотров на обычном классе:

```swift
final class ViewCounter {
    var views = 0
    func addView() { views += 1 }
}
```

Пусть две задачи одновременно вызвали `addView()`. Обе прочитали `41`, обе прибавили единицу, обе записали `42`. Один просмотр потерялся. Со словарём бывает хуже: если две задачи меняют его в одно и то же мгновение, программа может просто упасть. Это называется **гонка данных**. Такие ошибки появляются «иногда», и найти их очень трудно.

**Актор** — это тип, который сам выстраивает очередь к своим данным. Объявляется он как класс, только словом `actor`:

```swift
actor ViewCounter {
    private(set) var views = 0

    func addView() {
        views += 1
    }
}
```

Внутри актора код обычный, без всяких `await`. Но в каждый момент времени с его данными работает **только одна** задача. Остальные ждут своей очереди. Поэтому снаружи любое обращение к актору — и вызов метода, и чтение свойства — пишется с `await`. Это и есть «встать в очередь»:

```swift
let counter = ViewCounter()
await counter.addView()
print(await counter.views)   // 1
```

Ещё два правила:

- менять свойства актора снаружи нельзя даже с `await`. Строка `counter.views = 10` не соберётся. Менять данные может только сам актор, в своих методах;
- актор, как и класс, — ссылочный тип. Все, у кого есть ссылка, работают с одним и тем же объектом. Поэтому он и подходит для общего кэша.

> 💡 Проверка устроит кэшу настоящий час пик: сотни задач будут одновременно записывать и читать данные. Класс в таких условиях падает, а актор справляется спокойно.

### Задача
В редакторе есть готовая функция `downloadTemperature(city:)` — запрос к серверу, около 30 мс.

1. Объяви актор `ForecastCache`. Внутри:
   - закрытый словарь `storage` типа `[String: Int]`: город и температура. В начале пустой;
   - свойство `hits` типа `Int`, в начале `0`: сколько раз ответ нашёлся в кэше. Читать его можно всем, менять — только самому кэшу;
   - метод `cachedTemperature(for:)`: параметр `city` типа `String`, результат `Int?`. Если город есть в `storage`, увеличивает `hits` на 1 и возвращает температуру. Если нет — возвращает `nil`, а `hits` не меняет;
   - метод `save(_:for:)`: первый параметр `temperature` типа `Int` без метки, второй `city` типа `String` с меткой `for`. Записывает температуру в `storage`, заменяя старую;
   - вычисляемое свойство `count` типа `Int`: сколько городов в кэше.
2. Напиши асинхронную функцию `temperature(for:cache:)`. Параметры: `city` типа `String` с меткой `for` и `cache` типа `ForecastCache`. Результат `Int`:
   - если температура есть в кэше — верни её;
   - если нет — загрузи через `downloadTemperature(city:)`, сохрани в кэш и верни.

### Пример
```swift
let cache = ForecastCache()
await cache.cachedTemperature(for: "Сочи")             // nil
await temperature(for: "Сочи", cache: cache)           // 14 — из сети
await temperature(for: "Сочи", cache: cache)           // 14 — из кэша
await cache.hits                                       // 1
await cache.count                                      // 1
```

## @starter
```swift
// Сервер погоды (заглушка): отвечает через 30 мс.
// Для простоты он знает все города, которые встречаются в задаче.
func downloadTemperature(city: String) async -> Int {
    try? await Task.sleep(for: .milliseconds(30))
    let serverData = ["Москва": 5, "Сочи": 14, "Казань": -3, "Мурманск": 0, "Самара": -1]
    return serverData[city, default: 0]
}

// 1. Объяви актор ForecastCache:
//    storage — закрытый словарь "город -> температура"
//    hits — сколько раз ответ нашёлся в кэше (читать всем, менять только кэшу)
//    cachedTemperature(for:) -> Int?, save(_:for:), вычисляемое свойство count


// 2. Напиши функцию temperature(for:cache:) — сначала кэш, потом сеть


// Проба
let cache = ForecastCache()
print(await temperature(for: "Сочи", cache: cache))
print(await temperature(for: "Сочи", cache: cache))
print("Попаданий в кэш: \(await cache.hits)")
```

## @solution
```swift
// Сервер погоды (заглушка): отвечает через 30 мс.
// Для простоты он знает все города, которые встречаются в задаче.
func downloadTemperature(city: String) async -> Int {
    try? await Task.sleep(for: .milliseconds(30))
    let serverData = ["Москва": 5, "Сочи": 14, "Казань": -3, "Мурманск": 0, "Самара": -1]
    return serverData[city, default: 0]
}

// 1. Объяви актор ForecastCache:
//    storage — закрытый словарь "город -> температура"
//    hits — сколько раз ответ нашёлся в кэше (читать всем, менять только кэшу)
//    cachedTemperature(for:) -> Int?, save(_:for:), вычисляемое свойство count
actor ForecastCache {
    private var storage: [String: Int] = [:]
    private(set) var hits = 0

    var count: Int {
        storage.count
    }

    func cachedTemperature(for city: String) -> Int? {
        guard let temperature = storage[city] else {
            return nil
        }
        hits += 1
        return temperature
    }

    func save(_ temperature: Int, for city: String) {
        storage[city] = temperature
    }
}

// 2. Напиши функцию temperature(for:cache:) — сначала кэш, потом сеть
func temperature(for city: String, cache: ForecastCache) async -> Int {
    if let cached = await cache.cachedTemperature(for: city) {
        return cached
    }
    let fresh = await downloadTemperature(city: city)
    await cache.save(fresh, for: city)
    return fresh
}

// Проба
let cache = ForecastCache()
print(await temperature(for: "Сочи", cache: cache))
print(await temperature(for: "Сочи", cache: cache))
print("Попаданий в кэш: \(await cache.hits)")
```

## @output
```
14
14
Попаданий в кэш: 1
```

## @tests
```swift
let __t_empty = ForecastCache()
__eq("Новый кэш пуст", await __t_empty.count, 0, hint: "В начале словарь storage пустой, и count равен 0")
__eq("В новом кэше Москвы нет", await __t_empty.cachedTemperature(for: "Москва"), nil, hint: "Если города нет в storage, cachedTemperature возвращает nil")
__eq("Промах не считается попаданием", await __t_empty.hits, 0, hint: "hits увеличивается, только когда температура нашлась в кэше")

await __t_empty.save(5, for: "Москва")
__eq("Сохранили Москву — она есть в кэше", await __t_empty.cachedTemperature(for: "Москва"), 5)
__eq("Одно попадание", await __t_empty.hits, 1, hint: "Когда город нашёлся, hits увеличивается на 1")
__eq("В кэше один город", await __t_empty.count, 1, hint: "count — это количество записей в storage")
await __t_empty.save(7, for: "Москва")
__eq("Повторное сохранение заменяет старую температуру", await __t_empty.cachedTemperature(for: "Москва"), 7)
__eq("После замены город в кэше всё ещё один", await __t_empty.count, 1)

let __t_rush = ForecastCache()
await withTaskGroup(of: Void.self) { group in
    for i in 1...300 {
        group.addTask {
            await __t_rush.save(i, for: "Город \(i)")
        }
    }
}
__eq("Час пик: 300 одновременных записей — ни одна не потерялась", await __t_rush.count, 300)
await withTaskGroup(of: Void.self) { group in
    for _ in 1...500 {
        group.addTask {
            _ = await __t_rush.cachedTemperature(for: "Город 42")
        }
    }
}
__eq("Час пик: 500 одновременных чтений — счётчик точный", await __t_rush.hits, 500, hint: "Каждое удачное чтение должно увеличить hits ровно на 1")

let __t_cache = ForecastCache()
__eq("Сочи впервые — загрузка с сервера", await temperature(for: "Сочи", cache: __t_cache), 14, hint: "Если в кэше ничего нет, возьми температуру из downloadTemperature(city:)")
__eq("После загрузки Сочи лежит в кэше", await __t_cache.cachedTemperature(for: "Сочи"), 14, hint: "Загруженную температуру нужно сохранить: await cache.save(...)")
await __t_cache.save(99, for: "Казань")
__eq("Казань уже в кэше — сервер не нужен", await temperature(for: "Казань", cache: __t_cache), 99, hint: "Сначала спроси кэш. Сервер сказал бы -3, а в кэше лежит 99 — значит, ответ должен прийти из кэша")
__eq("Мурманск: ноль из сети тоже сохраняется", await temperature(for: "Мурманск", cache: __t_cache), 0)
__eq("В кэше три города", await __t_cache.count, 3)
```

## @rules
- must: /\bactor\s+ForecastCache\b/ :: Объяви `ForecastCache` словом `actor`, а не `class` или `struct`: только актор защищает данные от одновременного доступа.
- must: /private\s+var\s+storage\b/ :: Словарь `storage` должен быть закрытым: `private var storage`.
- must: /private\s*\(\s*set\s*\)\s*var\s+hits\b/ :: Счётчик `hits` читать можно всем, а менять — только кэшу: `private(set) var hits`.

## @hint1
Начни с актора. Он объявляется как класс, только словом `actor`. Внутри два хранимых свойства: закрытый пустой словарь `storage` и счётчик `hits`, который снаружи можно только читать. Как сделать «читать можно, менять нельзя», ты знаешь из «Чернил». Вычисляемое свойство `count` просто возвращает количество элементов словаря.

Метод `cachedTemperature` ищет город в словаре. Удобно через `guard let`: не нашёлся — верни `nil`. Нашёлся — увеличь `hits` и верни температуру. Метод `save` записывает значение в словарь по ключу. Внутри актора все эти строки обычные, без `await`.

Теперь функция `temperature(for:cache:)`. Она живёт снаружи актора, поэтому к кэшу обращается через `await`. Сначала спроси кэш через `if let`: если ответ есть — сразу верни его. Если нет — дождись `downloadTemperature`, положи результат в кэш методом `save` и верни его.

## @hint2
Актор со счётчиком и вызов его снаружи:

```swift
actor ViewCounter {
    private(set) var views = 0

    func addView() {
        views += 1
    }
}

let counter = ViewCounter()
await counter.addView()
print(await counter.views)
```

В функции `temperature(for:cache:)` первый шаг выглядит так:

```swift
if let cached = await cache.cachedTemperature(for: city) {
    return cached
}
```

## @hint3
Заполни пропуски:

```swift
___ ForecastCache {
    private var storage: [String: Int] = [:]
    private(set) var hits = 0

    var count: Int {
        storage.count
    }

    func cachedTemperature(for city: String) -> Int? {
        guard let temperature = storage[city] else {
            return nil
        }
        ___
        return temperature
    }

    func save(_ temperature: Int, for city: String) {
        storage[city] = temperature
    }
}

func temperature(for city: String, cache: ForecastCache) async -> Int {
    if let cached = await cache.cachedTemperature(for: city) {
        return cached
    }
    let fresh = await downloadTemperature(city: city)
    ___
    return fresh
}
```

В первом пропуске — слово, которым объявляется актор. Во втором — увеличение счётчика попаданий. В третьем — сохранение свежей температуры в кэш. Не забудь, что это обращение к актору снаружи.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `ForecastCache` — актор. Его свойства `storage` и `hits` защищены: в каждый момент с ними работает только одна задача. Когда сотни задач одновременно вызывают `save`, актор выстраивает их в очередь и выполняет по одной. Ни одна запись не теряется, словарь не ломается. Внутри методов `await` не нужен: код актора уже «у кассы».

**Почему снаружи везде `await`.** Функция `temperature(for:cache:)` не входит в актор. Каждое её обращение к кэшу — это «встать в очередь», а очередь может быть занята. Поэтому `await cache.cachedTemperature(for: city)` и `await cache.save(fresh, for: city)`. Так же и с чтением свойств: `await cache.hits`, `await cache.count`.

**Зачем `private` и `private(set)`.** Менять свойства актора снаружи и так нельзя. Но `private` прячет `storage` целиком: снаружи его нельзя даже прочитать, и никто не начнёт полагаться на то, как кэш устроен внутри. Завтра словарь можно будет заменить на что-то другое, и ни один экран этого не заметит. А `private(set)` у `hits` прямо говорит читателю кода: это счётчик только для чтения.

**Почему порядок «сначала кэш, потом сеть».** В этом весь смысл кэша: сеть медленная и дорогая, память быстрая. Проверка нарочно кладёт в кэш для Казани 99, хотя сервер сказал бы -3. Если ответ 99, значит, функция честно смотрит в кэш.

**Типичные ошибки:**

- `class ForecastCache` вместо `actor` — в обычной жизни всё работает, а в час пик программа падает;
- `hits += 1` стоит до `guard` — тогда промахи тоже считаются попаданиями;
- в `temperature(for:cache:)` забыт `save` — кэш так и остаётся пустым, и каждый раз идёт запрос в сеть;
- `cache.storage[city] = fresh` снаружи — актор не даст менять свои данные напрямую, нужен его метод.
