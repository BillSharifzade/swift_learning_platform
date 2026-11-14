---
title: Отменить поиск
concept: Task — отдельная задача, и её отмена
---

## @description

### Контекст
В «Горизонте» есть поиск городов. Человек набирает «Са», и приложение отправляет поиск. Через долю секунды он допечатывает «Сам», и уходит второй поиск. Первый уже никому не нужен, но продолжает листать страницы на сервере, тратит трафик и батарею. А если он закончится позже второго, на экране вместо Самары вдруг окажется старый список.

Тикет от тимлида: «Каждый новый поиск должен отменять предыдущий. И сам поиск пусть замечает отмену и останавливается, а не досчитывает до конца».

### Новое в Swift
**Задача `Task`.** До сих пор асинхронный код ждал прямо на месте. Но иногда работу нужно запустить «отдельно»: она идёт сама по себе, а у тебя в руках остаётся пульт управления ею. Для этого есть `Task`:

```swift
let upload = Task {
    try await uploadPhotos(["море.jpg", "горы.jpg"])
}
```

Код в фигурных скобках начинает выполняться сразу, а в `upload` попадает сама задача. Её тип записывается как `Task<Результат, Ошибка>`. Здесь это `Task<Int, Error>`, если `uploadPhotos` возвращает `Int` и может бросить ошибку. Что с задачей можно делать:

- `try await upload.value` — дождаться результата. Если задача закончилась ошибкой, она бросится здесь;
- `upload.cancel()` — попросить задачу остановиться;
- `upload.isCancelled` — узнать, просили ли её остановиться.

**Отмена — это просьба, а не выключатель.** Представь, что ты отменила заказ, а курьер уже в пути. Он узнает об этом, только когда посмотрит в телефон. Если не смотреть, он довезёт заказ до конца. `cancel()` лишь поднимает флажок «тебя отменили». Чтобы работа действительно остановилась, код задачи должен этот флажок проверять — обычно перед каждым долгим шагом:

```swift
func uploadPhotos(_ names: [String]) async throws -> Int {
    var uploaded = 0
    for name in names {
        try Task.checkCancellation()   // отменили? тогда дальше не идём
        await sendToServer(name)
        uploaded += 1
    }
    return uploaded
}
```

`try Task.checkCancellation()` ничего не делает, если флажка нет. А если есть — бросает ошибку `CancellationError`, и функция заканчивается, как при любой ошибке. Есть и мягкий вариант: свойство `Task.isCancelled` возвращает `true` или `false`, а что делать дальше, ты решаешь сама.

> 💡 Многие встроенные функции проверяют флажок сами. Например, `try await Task.sleep(...)` в отменённой задаче сразу бросает `CancellationError`. Но чужой код не всегда так аккуратен. Функция `loadPage` в редакторе отмену не замечает, поэтому проверять придётся тебе.

### Задача
1. Напиши функцию `searchCities(matching:)`. Параметр `query` типа `String`, при вызове метка `matching`. Функция асинхронная, бросает ошибки, возвращает `[String]`. Она проходит страницы с 1 по 3 по порядку и для каждой:
   - сначала проверяет отмену через `try Task.checkCancellation()`;
   - потом загружает страницу: `await loadPage(номер)`;
   - добавляет к результату города, которые начинаются с `query`, сохраняя их порядок.
2. Напиши функцию `restartSearch(_:previous:)`. Первый параметр `query` типа `String` без метки, второй — `previous` типа `Task<[String], Error>?`, предыдущий поиск или `nil`. Функция **не** асинхронная, она возвращает `Task<[String], Error>`:
   - отменяет предыдущий поиск, если он есть;
   - возвращает новую задачу, которая выполняет `searchCities(matching: query)`.

Внизу программы уже есть проба: два поиска подряд, первый отменяется вторым.

### Пример
```swift
try await searchCities(matching: "Ка")   // ["Казань", "Калининград"]

let first = restartSearch("Са", previous: nil)
let second = restartSearch("Сам", previous: first)
first.isCancelled              // true
try await second.value         // ["Самара"]
```

Вывод программы:

```text
Поиск по Са отменён
Найдено по Сам: Самара
```

## @starter
```swift
// Сервер поиска (заглушка): отдаёт города страницами, каждая — около 30 мс.
// Функция из старой библиотеки: отмену она НЕ замечает.
func loadPage(_ number: Int) async -> [String] {
    try? await Task.sleep(for: .milliseconds(30))
    let pages = [
        1: ["Самара", "Москва", "Саратов", "Мурманск"],
        2: ["Сочи", "Казань", "Салехард", "Калининград"],
        3: ["Санкт-Петербург", "Кострома", "Саранск", "Сургут"]
    ]
    return pages[number] ?? []
}

// 1. Напиши функцию searchCities(matching:) — проверяй отмену перед каждой страницей


// 2. Напиши функцию restartSearch(_:previous:) — отменяет прошлый поиск и запускает новый


// Проба: человек набрал "Са", а потом сразу "Сам"
let first = restartSearch("Са", previous: nil)
let second = restartSearch("Сам", previous: first)

do {
    let cities = try await first.value
    print("Найдено по Са: \(cities.joined(separator: ", "))")
} catch {
    print("Поиск по Са отменён")
}

do {
    let cities = try await second.value
    print("Найдено по Сам: \(cities.joined(separator: ", "))")
} catch {
    print("Поиск по Сам отменён")
}
```

## @solution
```swift
// Сервер поиска (заглушка): отдаёт города страницами, каждая — около 30 мс.
// Функция из старой библиотеки: отмену она НЕ замечает.
func loadPage(_ number: Int) async -> [String] {
    try? await Task.sleep(for: .milliseconds(30))
    let pages = [
        1: ["Самара", "Москва", "Саратов", "Мурманск"],
        2: ["Сочи", "Казань", "Салехард", "Калининград"],
        3: ["Санкт-Петербург", "Кострома", "Саранск", "Сургут"]
    ]
    return pages[number] ?? []
}

// 1. Напиши функцию searchCities(matching:) — проверяй отмену перед каждой страницей
func searchCities(matching query: String) async throws -> [String] {
    var found: [String] = []
    for page in 1...3 {
        try Task.checkCancellation()
        let cities = await loadPage(page)
        found += cities.filter { $0.hasPrefix(query) }
    }
    return found
}

// 2. Напиши функцию restartSearch(_:previous:) — отменяет прошлый поиск и запускает новый
func restartSearch(_ query: String, previous: Task<[String], Error>?) -> Task<[String], Error> {
    previous?.cancel()
    return Task {
        try await searchCities(matching: query)
    }
}

// Проба: человек набрал "Са", а потом сразу "Сам"
let first = restartSearch("Са", previous: nil)
let second = restartSearch("Сам", previous: first)

do {
    let cities = try await first.value
    print("Найдено по Са: \(cities.joined(separator: ", "))")
} catch {
    print("Поиск по Са отменён")
}

do {
    let cities = try await second.value
    print("Найдено по Сам: \(cities.joined(separator: ", "))")
} catch {
    print("Поиск по Сам отменён")
}
```

## @output
```
Поиск по Са отменён
Найдено по Сам: Самара
```

## @tests
```swift
do {
    __eq("Поиск по Са: города со всех трёх страниц по порядку", try await searchCities(matching: "Са"), ["Самара", "Саратов", "Салехард", "Санкт-Петербург", "Саранск"], hint: "Пройди страницы с 1 по 3 и с каждой добавь города, которые начинаются с query")
    __eq("Поиск по Ка", try await searchCities(matching: "Ка"), ["Казань", "Калининград"])
    __eq("Поиск по Ко — город только на третьей странице", try await searchCities(matching: "Ко"), ["Кострома"], hint: "Не останавливайся после первой страницы: страниц три")
    __eq("Поиск по Я — ничего не найдено", try await searchCities(matching: "Я"), [], hint: "Если подходящих городов нет, верни пустой массив")
} catch {
    __fail("Обычный поиск проходит без ошибок", "Функция бросила ошибку: \(error)")
}

let __t_selfCancelled = Task { () -> [String] in
    withUnsafeCurrentTask { $0?.cancel() }
    return try await searchCities(matching: "Са")
}
do {
    let found = try await __t_selfCancelled.value
    __fail("Поиск, отменённый ещё до начала, бросает CancellationError", "Поиск вернул результат \(found), хотя его отменили. Проверяй отмену через try Task.checkCancellation() перед загрузкой страницы")
} catch is CancellationError {
    __pass("Поиск, отменённый ещё до начала, бросает CancellationError")
} catch {
    __fail("Поиск, отменённый ещё до начала, бросает CancellationError", "Брошена другая ошибка: \(error)")
}

let __t_midway = Task { try await searchCities(matching: "Са") }
try? await Task.sleep(for: .milliseconds(10))
__t_midway.cancel()
do {
    let found = try await __t_midway.value
    __fail("Поиск, отменённый на первой странице, не идёт дальше", "Поиск дошёл до конца и вернул \(found). Проверяй отмену перед КАЖДОЙ страницей, а не один раз в начале")
} catch is CancellationError {
    __pass("Поиск, отменённый на первой странице, не идёт дальше")
} catch {
    __fail("Поиск, отменённый на первой странице, не идёт дальше", "Брошена другая ошибка: \(error)")
}

let __t_a = restartSearch("Ка", previous: nil)
let __t_b = restartSearch("Са", previous: __t_a)
__ok("Новый поиск отменяет предыдущий", __t_a.isCancelled, hint: "В начале restartSearch вызови previous?.cancel()")
__ok("Сам новый поиск не отменён", !__t_b.isCancelled, hint: "Отменять нужно только previous, а новую задачу — нет")
do {
    __eq("Новый поиск находит города", try await __t_b.value, ["Самара", "Саратов", "Салехард", "Санкт-Петербург", "Саранск"], hint: "Новая задача должна выполнять searchCities(matching: query)")
} catch {
    __fail("Новый поиск находит города", "Новый поиск закончился ошибкой: \(error)")
}
do {
    _ = try await __t_a.value
    __fail("Отменённый поиск заканчивается ошибкой отмены", "Отменённый поиск вернул результат")
} catch is CancellationError {
    __pass("Отменённый поиск заканчивается ошибкой отмены")
} catch {
    __fail("Отменённый поиск заканчивается ошибкой отмены", "Брошена другая ошибка: \(error)")
}

let __t_first = restartSearch("Му", previous: nil)
do {
    __eq("Первый поиск без предыдущего (previous равен nil)", try await __t_first.value, ["Мурманск"], hint: "Если previous равен nil, отменять нечего — просто запусти новый поиск")
} catch {
    __fail("Первый поиск без предыдущего (previous равен nil)", "Поиск закончился ошибкой: \(error)")
}
```

## @rules
- must: /Task\.checkCancellation\s*\(\s*\)|Task\.isCancelled/ :: В `searchCities` проверяй отмену: `try Task.checkCancellation()` перед загрузкой каждой страницы.
- must: /\.cancel\s*\(\s*\)/ :: В `restartSearch` отмени предыдущий поиск: `previous?.cancel()`.
- must: /\bTask\s*(\{|\(\s*\{)/ :: В `restartSearch` запусти новый поиск как отдельную задачу: `Task { ... }`.

## @hint1
Начни с `searchCities`. В объявлении: метка `matching`, внутреннее имя `query`, после скобок `async throws`, результат — массив строк. Внутри заведи пустой массив для найденного и цикл по номерам страниц от 1 до 3.

В цикле три шага. Первый — проверка отмены: `try` и вызов `checkCancellation()` у типа `Task`. Если поиск отменили, здесь бросится ошибка, и функция закончится. Второй — загрузка страницы через `await loadPage`. Третий — отбор: из городов страницы оставь те, что начинаются с `query`, и добавь их в массив. Отобрать удобно через `filter` и `hasPrefix`. После цикла верни массив.

Теперь `restartSearch`. Она не асинхронная: только запускает поиск, а не ждёт его. Сначала отмени предыдущий поиск. Он опционал, поэтому нужен вопросительный знак перед точкой. Потом верни новую задачу: `Task` и фигурные скобки, внутри — вызов `searchCities` с `try await`.

## @hint2
Проверка отмены перед каждым шагом:

```swift
for name in names {
    try Task.checkCancellation()
    await sendToServer(name)
    uploaded += 1
}
```

А так создаётся задача, которую потом можно отменить или дождаться:

```swift
let upload = Task {
    try await uploadPhotos(["море.jpg", "горы.jpg"])
}
upload.cancel()
```

В `restartSearch` такую задачу не кладут в константу, а сразу возвращают через `return`.

## @hint3
Заполни пропуски:

```swift
func searchCities(matching query: String) async throws -> [String] {
    var found: [String] = []
    for page in 1...3 {
        ___
        let cities = await loadPage(page)
        found += cities.filter { $0.hasPrefix(query) }
    }
    return found
}

func restartSearch(_ query: String, previous: Task<[String], Error>?) -> Task<[String], Error> {
    ___
    return Task {
        ___ searchCities(matching: query)
    }
}
```

В первом пропуске — проверка отмены. Во втором — отмена предыдущего поиска, который может быть `nil`. В третьем — два слова перед вызовом бросающей асинхронной функции.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает `searchCities`.** Цикл идёт по трём страницам. Перед каждой `try Task.checkCancellation()` смотрит на флажок отмены. Пока флажка нет, строка ничего не делает: страница загружается, подходящие города добавляются в `found`. Как только поиск отменили, на ближайшей проверке бросается `CancellationError`. Функция заканчивается, оставшиеся страницы не загружаются.

**Почему проверка внутри цикла, а не один раз в начале.** Отмена может прийти в любой момент, чаще всего — посреди работы. Если проверить флажок только в начале, поиск, отменённый на первой странице, честно догрузит остальные. Проверка это ловит: отменяет поиск через 10 мс после старта и ждёт `CancellationError`. Проверять флажок стоит перед каждым долгим шагом.

**Как работает `restartSearch`.** `previous?.cancel()` поднимает флажок у прошлого поиска. Если его нет, то есть `previous` равен `nil`, строка просто ничего не делает. `Task { ... }` запускает новый поиск отдельной задачей и сразу возвращает её. Тот, кто вызвал `restartSearch`, сам решит, когда ждать результат через `value` и не пора ли отменить и эту задачу.

**Почему `restartSearch` не асинхронная.** Она ничего не ждёт: отменить старое и запустить новое можно мгновенно. Так и задумано. Когда человек набирает букву, экран не должен ждать поиска, чтобы показать её в поле ввода.

**Типичные ошибки:**

- `Task.checkCancellation()` без `try` — функция бросает ошибку, Swift этого не пропустит;
- проверка стоит после `loadPage`, а не перед ней — лишняя страница всё равно загрузится;
- `previous.cancel()` без вопросительного знака — `previous` опционал;
- `try await searchCities(...)` прямо в `restartSearch` без `Task` — тогда функция станет ждать поиск, а не запускать его.
