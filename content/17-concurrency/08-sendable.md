---
title: Безопасная передача
concept: Sendable — какие данные можно передавать между задачами (режим Swift 6)
swiftArgs: -swift-version 6
---

## @description

### Контекст
Команда «Горизонта» переводит проект на **режим Swift 6**. В нём компилятор строго проверяет конкурентный код: всё, что может привести к гонке данных, становится ошибкой ещё до запуска. В режиме Swift 5 такой код собирался, а гонки ловили потом, по отчётам о сбоях.

После переключения перестала собираться лента новостей. Она загружает разделы одновременно через группу задач, отбрасывает непопулярные статьи и считает, сколько их скрыто. Тимлид: «Задача на сегодня — сделать ленту безопасной. Никаких `@unchecked` и прочих заглушек: только честные исправления».

> ⚠️ Эта задача проверяется в режиме Swift 6. Нажми «Проверить» сразу, ничего не меняя, и прочитай, что скажет компилятор.

### Новое в Swift
Представь, что тебе нужно отдать документ коллеге. Можно отдать **копию** — тогда каждый правит свою, и никто никому не мешает. Можно отдать **запечатанный конверт** — его можно только читать. А можно сесть вдвоём за один черновик и править его одновременно. Вот тут и начинается путаница: один стирает абзац, который другой как раз дописывает.

Задачи в Swift передают друг другу данные постоянно: аргументы в `addTask`, результаты из группы, значения в актор и обратно. **`Sendable`** — это протокол-пометка «такое значение можно безопасно отдать другой задаче». Методов у него нет. Это обещание, которое проверяет компилятор.

Какие типы `Sendable`:

- `Int`, `String`, `Bool`, `Double` и массивы, словари, кортежи из таких значений;
- **структуры и перечисления**, у которых все свойства `Sendable`. При передаче они копируются — это та самая копия документа;
- **`final`-классы, у которых все свойства `let`** и сами `Sendable`. Изменить такой объект нельзя — это запечатанный конверт;
- акторы — всегда: они сами выстраивают очередь к своим данным.

А вот обычный класс со свойствами `var` — тот самый общий черновик. Его `Sendable` сделать нельзя.

Пометку пишут, как любой протокол:

```swift
struct Ticket: Sendable {
    let route: String
    let price: Int
}

final class AppConfig: Sendable {
    let serverName: String
    let timeoutSeconds: Int

    init(serverName: String, timeoutSeconds: Int) {
        self.serverName = serverName
        self.timeoutSeconds = timeoutSeconds
    }
}
```

Структуру без пометки Swift и сам признаёт `Sendable`, если может. Но явная пометка — это обещание: если кто-то потом добавит в `Ticket` что-то небезопасное, компилятор сразу укажет на эту строку.

**Замыкания в `addTask` и `Task`** выполняются параллельно с остальным кодом. Поэтому менять внешнюю переменную `var` из них нельзя: две задачи могли бы сделать это одновременно. Результаты возвращают через `return`, а складывают уже в цикле `for await` — там они приходят строго по одному:

```swift
group.addTask {
    let size = await fetchPhotoSize(name: name)
    return (name, size)            // результат — через return
}
// ...
for await (name, size) in group {
    totalSize += size              // здесь безопасно: по одному
}
```

**Как читать ошибки.** Они придут волнами: исправишь одни — появятся следующие. Вот что значат сообщения, которые ты увидишь:

- `type 'NewsArticle' does not conform to the 'Sendable' protocol` — «тип не `Sendable`»: значения этого типа нельзя безопасно передавать между задачами;
- `non-final class ... cannot conform to 'Sendable'` — класс без `final` не может быть `Sendable`;
- `stored property ... of 'Sendable'-conforming class ... is mutable` — у класса с отметкой `Sendable` осталось свойство `var`;
- `passing closure as a 'sending' parameter risks causing data races` — замыкание, которое уходит в другую задачу, может устроить гонку. Посмотри, что оно берёт снаружи: объект не-`Sendable` типа или переменную `var`, которую меняет.

### Задача
Код ленты уже написан, но в режиме Swift 6 не собирается. Исправь его так:

1. `NewsArticle` — структура с отметкой `Sendable`. Свойства те же: `title` (`String`), `section` (`String`), `views` (`Int`), все через `let`. Свой `init` больше не нужен.
2. `FeedSettings` остаётся классом: это один общий объект настроек, на него ссылаются несколько экранов. Сделай его `final`, с отметкой `Sendable`, а свойства `sections` и `minViews` — через `let`.
3. `NewsFeed` тоже отметь `Sendable`.
4. В `loadFeed(settings:)` убери изменение `hiddenCount` из замыкания `addTask`. Пусть каждая задача возвращает и видимые статьи своего раздела, и число скрытых. Суммируй скрытые уже в цикле `for await`.

Поведение ленты не меняется. Статья видна, если у неё не меньше `minViews` просмотров. Лента отсортирована по просмотрам, от больших к меньшим. `hiddenCount` — сколько статей скрыто во всех разделах вместе.

### Пример
```swift
let settings = FeedSettings(sections: ["Город", "Погода"], minViews: 1000)
let feed = await loadFeed(settings: settings)
feed.articles.map { $0.title }   // ["Снегопад до вечера", "Открылся новый каток"]
feed.hiddenCount                 // 3
```

Вывод программы:

```text
Снегопад до вечера (5400)
Открылся новый каток (1200)
Скрыто неинтересных: 3
```

## @starter
```swift
// Статья ленты
class NewsArticle {
    var title: String
    var section: String
    var views: Int

    init(title: String, section: String, views: Int) {
        self.title = title
        self.section = section
        self.views = views
    }
}

// Настройки ленты: их выбирает пользователь
class FeedSettings {
    var sections: [String]
    var minViews: Int

    init(sections: [String], minViews: Int) {
        self.sections = sections
        self.minViews = minViews
    }
}

// Готовая лента для экрана
struct NewsFeed {
    let articles: [NewsArticle]
    let hiddenCount: Int
}

// Сервер новостей (заглушка): у каждого раздела своя скорость ответа
func downloadSection(_ section: String) async -> [NewsArticle] {
    switch section {
    case "Город":
        try? await Task.sleep(for: .milliseconds(30))
        return [
            NewsArticle(title: "Открылся новый каток", section: section, views: 1200),
            NewsArticle(title: "Ремонт моста продлят до весны", section: section, views: 300),
            NewsArticle(title: "В парке высадят 200 лип", section: section, views: 800)
        ]
    case "Погода":
        try? await Task.sleep(for: .milliseconds(10))
        return [
            NewsArticle(title: "Снегопад до вечера", section: section, views: 5400),
            NewsArticle(title: "Неделя будет тёплой", section: section, views: 950)
        ]
    case "Спорт":
        try? await Task.sleep(for: .milliseconds(20))
        return [
            NewsArticle(title: "Хоккейный клуб вышел в плей-офф", section: section, views: 3100),
            NewsArticle(title: "Лыжня в парке готова", section: section, views: 1500)
        ]
    default:
        try? await Task.sleep(for: .milliseconds(10))
        return []
    }
}

// Загружает разделы одновременно и собирает ленту
func loadFeed(settings: FeedSettings) async -> NewsFeed {
    var hiddenCount = 0
    let articles = await withTaskGroup(of: [NewsArticle].self) { group in
        for section in settings.sections {
            group.addTask {
                let all = await downloadSection(section)
                let visible = all.filter { $0.views >= settings.minViews }
                hiddenCount += all.count - visible.count
                return visible
            }
        }
        var result: [NewsArticle] = []
        for await part in group {
            result += part
        }
        return result
    }
    return NewsFeed(articles: articles.sorted { $0.views > $1.views }, hiddenCount: hiddenCount)
}

// Проба: лента для разделов "Город" и "Погода"
let settings = FeedSettings(sections: ["Город", "Погода"], minViews: 1000)
let feed = await loadFeed(settings: settings)
for article in feed.articles {
    print("\(article.title) (\(article.views))")
}
print("Скрыто неинтересных: \(feed.hiddenCount)")
```

## @solution
```swift
// Статья ленты
struct NewsArticle: Sendable {
    let title: String
    let section: String
    let views: Int
}

// Настройки ленты: их выбирает пользователь
final class FeedSettings: Sendable {
    let sections: [String]
    let minViews: Int

    init(sections: [String], minViews: Int) {
        self.sections = sections
        self.minViews = minViews
    }
}

// Готовая лента для экрана
struct NewsFeed: Sendable {
    let articles: [NewsArticle]
    let hiddenCount: Int
}

// Сервер новостей (заглушка): у каждого раздела своя скорость ответа
func downloadSection(_ section: String) async -> [NewsArticle] {
    switch section {
    case "Город":
        try? await Task.sleep(for: .milliseconds(30))
        return [
            NewsArticle(title: "Открылся новый каток", section: section, views: 1200),
            NewsArticle(title: "Ремонт моста продлят до весны", section: section, views: 300),
            NewsArticle(title: "В парке высадят 200 лип", section: section, views: 800)
        ]
    case "Погода":
        try? await Task.sleep(for: .milliseconds(10))
        return [
            NewsArticle(title: "Снегопад до вечера", section: section, views: 5400),
            NewsArticle(title: "Неделя будет тёплой", section: section, views: 950)
        ]
    case "Спорт":
        try? await Task.sleep(for: .milliseconds(20))
        return [
            NewsArticle(title: "Хоккейный клуб вышел в плей-офф", section: section, views: 3100),
            NewsArticle(title: "Лыжня в парке готова", section: section, views: 1500)
        ]
    default:
        try? await Task.sleep(for: .milliseconds(10))
        return []
    }
}

// Загружает разделы одновременно и собирает ленту
func loadFeed(settings: FeedSettings) async -> NewsFeed {
    await withTaskGroup(of: (visible: [NewsArticle], hidden: Int).self) { group in
        for section in settings.sections {
            group.addTask {
                let all = await downloadSection(section)
                let visible = all.filter { $0.views >= settings.minViews }
                return (visible, all.count - visible.count)
            }
        }
        var articles: [NewsArticle] = []
        var hiddenCount = 0
        for await part in group {
            articles += part.visible
            hiddenCount += part.hidden
        }
        return NewsFeed(articles: articles.sorted { $0.views > $1.views }, hiddenCount: hiddenCount)
    }
}

// Проба: лента для разделов "Город" и "Погода"
let settings = FeedSettings(sections: ["Город", "Погода"], minViews: 1000)
let feed = await loadFeed(settings: settings)
for article in feed.articles {
    print("\(article.title) (\(article.views))")
}
print("Скрыто неинтересных: \(feed.hiddenCount)")
```

## @output
```
Снегопад до вечера (5400)
Открылся новый каток (1200)
Скрыто неинтересных: 3
```

## @tests
```swift
let __t_article = NewsArticle(title: "Мост открыт", section: "Город", views: 10)
__eq("NewsArticle создаётся без своего init: заголовок", __t_article.title, "Мост открыт")
__eq("NewsArticle: просмотры", __t_article.views, 10)

let __t_all = await loadFeed(settings: FeedSettings(sections: ["Город", "Погода", "Спорт"], minViews: 0))
__eq("Три раздела без порога: все семь статей по убыванию просмотров", __t_all.articles.map { $0.title }, ["Снегопад до вечера", "Хоккейный клуб вышел в плей-офф", "Лыжня в парке готова", "Открылся новый каток", "Неделя будет тёплой", "В парке высадят 200 лип", "Ремонт моста продлят до весны"], hint: "Лента сортируется по views, от больших к меньшим")
__eq("Три раздела без порога: ничего не скрыто", __t_all.hiddenCount, 0)

let __t_popular = await loadFeed(settings: FeedSettings(sections: ["Город", "Спорт"], minViews: 1000))
__eq("Город и Спорт, порог 1000: видимые статьи", __t_popular.articles.map { $0.title }, ["Хоккейный клуб вышел в плей-офф", "Лыжня в парке готова", "Открылся новый каток"])
__eq("Город и Спорт, порог 1000: скрыто две статьи", __t_popular.hiddenCount, 2, hint: "hiddenCount — сумма скрытых статей из всех разделов. Каждая задача возвращает своё число, а складываются они в цикле for await")

let __t_edge = await loadFeed(settings: FeedSettings(sections: ["Город"], minViews: 1200))
__eq("Ровно 1200 просмотров при пороге 1200 — статья видна", __t_edge.articles.map { $0.title }, ["Открылся новый каток"], hint: "Статья видна, если views >= minViews")
__eq("Порог 1200 в разделе Город: скрыто две", __t_edge.hiddenCount, 2)

let __t_strict = await loadFeed(settings: FeedSettings(sections: ["Погода", "Спорт", "Город"], minViews: 10000))
__eq("Слишком высокий порог: лента пуста", __t_strict.articles.count, 0)
__eq("Слишком высокий порог: скрыты все семь", __t_strict.hiddenCount, 7)

let __t_empty = await loadFeed(settings: FeedSettings(sections: [], minViews: 0))
__eq("Ни одного раздела: лента пуста", __t_empty.articles.count, 0)
__eq("Ни одного раздела: скрыто ноль", __t_empty.hiddenCount, 0)
```

## @rules
- must: /struct\s+NewsArticle\s*:[^{]*\bSendable\b/ :: Объяви `NewsArticle` структурой с явной отметкой: `struct NewsArticle: Sendable`.
- must: /final\s+class\s+FeedSettings\s*:[^{]*\bSendable\b/ :: `FeedSettings` должен остаться классом, но безопасным: `final class FeedSettings: Sendable`.
- must: /struct\s+NewsFeed\s*:[^{]*\bSendable\b/ :: Отметь и ленту: `struct NewsFeed: Sendable`.
- mustnot: /\bvar\s+(title|section|views)\b/ :: Статья после загрузки не меняется: объяви свойства `NewsArticle` через `let`.
- mustnot: /@unchecked|nonisolated\s*\(\s*unsafe\s*\)|@preconcurrency/ :: Без заглушек: `@unchecked`, `nonisolated(unsafe)` и `@preconcurrency` отключают проверку, а не делают код безопасным.

## @hint1
Иди по ошибкам компилятора сверху вниз — их будет несколько волн: исправишь одни, появятся следующие. Это нормально.

Первая волна — про `NewsArticle`. Это класс со свойствами `var`, а его статьи передаются из задач группы наружу. Преврати его в структуру, свойства объяви через `let`, после имени поставь двоеточие и `Sendable`. Свой `init` удали: у структуры есть автоматический.

Вторая волна — про `FeedSettings`. Задачи группы читают настройки, значит, их тоже передают между задачами. Класс может быть `Sendable`, только если от него нельзя унаследоваться и его нельзя изменить. Поэтому слово `final` перед `class`, `let` вместо `var` и отметка `Sendable`. `init` у класса остаётся. Заодно отметь `Sendable` и `NewsFeed`.

Третья волна — про `hiddenCount`. Его меняют сразу несколько задач. Пусть каждая задача возвращает пару: видимые статьи и число скрытых. Тип результата задачи в `of:` тогда — кортеж. А общий счётчик заведи рядом со списком статей и прибавляй к нему в `for await`.

## @hint2
Структура и `final`-класс с отметкой `Sendable`:

```swift
struct Ticket: Sendable {
    let route: String
    let price: Int
}

final class AppConfig: Sendable {
    let serverName: String
    let timeoutSeconds: Int
    // init как раньше
}
```

Задача группы возвращает пару значений, а складываются они в цикле:

```swift
await withTaskGroup(of: (visible: [NewsArticle], hidden: Int).self) { group in
    // ...
    group.addTask {
        // ...
        return (visible, all.count - visible.count)
    }
    // ...
    for await part in group {
        articles += part.visible
        hiddenCount += part.hidden
    }
}
```

## @hint3
Типы готовы, допиши `loadFeed`:

```swift
func loadFeed(settings: FeedSettings) async -> NewsFeed {
    await withTaskGroup(of: (visible: [NewsArticle], hidden: Int).self) { group in
        for section in settings.sections {
            group.addTask {
                let all = await downloadSection(section)
                let visible = all.filter { $0.views >= settings.minViews }
                return ___
            }
        }
        var articles: [NewsArticle] = []
        var hiddenCount = 0
        for await part in group {
            articles += part.visible
            ___
        }
        return NewsFeed(articles: articles.sorted { $0.views > $1.views }, hiddenCount: hiddenCount)
    }
}
```

В первом пропуске — пара из видимых статей и количества скрытых: всех статей раздела минус видимые. Во втором — прибавление скрытых из очередного раздела к общему счётчику. И не забудь сами типы: `struct NewsArticle: Sendable`, `final class FeedSettings: Sendable` с `let`-свойствами, `struct NewsFeed: Sendable`.

## @hint4
Вот готовое решение:

{{solution}}

**`NewsArticle` — структура.** Статьи создаются в задачах группы и уезжают из них наружу. Структура при передаче копируется: у каждой задачи своя копия, делить нечего. Все свойства — `String` и `Int`, то есть `Sendable`, поэтому обещание `: Sendable` компилятор принимает. Свой `init` больше не нужен: автоматический инициализатор структуры принимает те же три параметра.

**`FeedSettings` — `final`-класс с `let`.** Настройки — общий объект, и задачи группы читают его одновременно. Читать вместе безопасно, опасно только менять. Свойства `let` гарантируют, что после создания объект не изменится. `final` гарантирует, что никто не напишет наследника с новым `var`-свойством. Только при обоих условиях класс может быть `Sendable`.

**Счётчик в `for await`.** Раньше каждая задача прибавляла к общему `hiddenCount` прямо из своего замыкания. Задачи идут параллельно, и две из них могли бы сделать `+=` одновременно — та же гонка, что у счётчика просмотров. Теперь задача ничего снаружи не трогает: она **возвращает** свой результат. А цикл `for await` получает результаты строго по одному, поэтому `hiddenCount += part.hidden` безопасен.

**Почему не `@unchecked Sendable`.** Эта пометка говорит компилятору: «не проверяй, я сама отвечаю за безопасность». Иногда её используют опытные разработчики, когда защищают данные вручную. Здесь защиты нет, и такая пометка просто спрятала бы гонку.

**Типичные ошибки:**

- у `NewsArticle` остались свойства `var` — структура с ними тоже была бы `Sendable`, но статья после загрузки не меняется, и `let` честно это показывает;
- `class FeedSettings: Sendable` без `final` — компилятор не примет: у наследника могли бы появиться изменяемые свойства;
- `hiddenCount` стал `let` снаружи группы — тогда к нему нельзя прибавлять. Счётчик нужен внутри замыкания группы, рядом с `articles`;
- в `of:` остался `[NewsArticle].self`, а задача возвращает пару — Swift сообщит о несовпадении типов.
