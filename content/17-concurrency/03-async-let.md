---
title: Погода и новости разом
concept: Параллельные запросы — async let
---

## @description

### Контекст
Главный экран «Горизонта» собирается из трёх частей: погода, новости города и предупреждения метеослужбы. Каждая часть приходит отдельным запросом, и каждый запрос идёт до сервера около 100 миллисекунд.

Сейчас экран загружается так: сначала погода, потом, дождавшись её, новости, потом предупреждения. Выходит в три раза дольше, чем могло бы. Тикет от тимлида: «Запросы друг от друга не зависят. Запускай все три сразу и жди, пока придут. Экран должен открываться за время одного запроса, а не трёх».

### Новое в Swift
Утром ты ставишь чайник и, пока он закипает, делаешь бутерброд. Никто не стоит пять минут над чайником, чтобы только потом взяться за хлеб. Два дела идут одновременно, а завтрак готов, когда закончилось последнее из них.

Обычный `await` работает как ожидание у чайника. Пока не пришёл первый ответ, второй запрос даже не начинается:

```swift
let rates = await fetchCurrencyRates()              // ждём ~100 мс
let traffic = await fetchTraffic(city: "Казань")   // и ещё ~100 мс
```

Чтобы запросы шли **параллельно**, то есть одновременно, есть `async let`:

```swift
async let rates = fetchCurrencyRates()              // запрос ушёл, ждать не стали
async let traffic = fetchTraffic(city: "Казань")   // и этот ушёл сразу

let screen = TrafficScreen(rates: await rates, traffic: await traffic)
```

Как это работает:

- `async let` запускает работу в фоне и **сразу** переходит к следующей строке. Перед вызовом справа `await` не пишут;
- в константе пока нет значения, только обещание, что оно появится;
- когда значение понадобилось, перед именем ставят `await`. Если ответ уже пришёл, он берётся сразу, если нет — код подождёт.

Оба запроса стартовали почти в одну и ту же секунду, поэтому общее время — как у самого долгого из них, а не сумма.

> ⚠️ `async let` подходит только для **независимых** запросов. Если второму запросу нужен ответ первого (например, сначала узнать город по геопозиции, потом загрузить его погоду), параллельно их не запустить. Тут нужен обычный `await`.

### Задача
В редакторе уже есть структура `HomeScreen` и три готовые функции-запроса: `fetchWeather(city:)`, `fetchHeadlines(city:)` и `fetchAlerts(city:)`. Каждая ждёт «сеть» около 100 мс.

1. Напиши асинхронную функцию `loadHomeScreen(city:)`. Параметр `city` типа `String`, результат — `HomeScreen`.
2. Запусти все три запроса для этого города **одновременно** — через три `async let`.
3. Дождись ответов и верни `HomeScreen`: в `weather` — ответ `fetchWeather`, в `headlines` — ответ `fetchHeadlines`, в `alerts` — ответ `fetchAlerts`.

Проверка засекает время: экран должен собираться заметно быстрее, чем три запроса по очереди.

### Пример
```swift
let screen = await loadHomeScreen(city: "Сочи")
screen.weather     // "+14, солнечно"
screen.headlines   // ["Пляжи готовят к сезону"]
screen.alerts      // []
```

Вывод программы:

```text
Погода: -3, снег
Новостей: 2
Предупреждений: 1
```

## @starter
```swift
// Данные главного экрана
struct HomeScreen {
    let weather: String        // погода сейчас
    let headlines: [String]    // новости города
    let alerts: [String]       // предупреждения метеослужбы
}

// Имитация сети: соединение и загрузка, около 100 мс
func networkDelay() async {
    try? await Task.sleep(for: .milliseconds(50))   // соединение с сервером
    try? await Task.sleep(for: .milliseconds(50))   // загрузка данных
}

// Три готовых запроса. Друг от друга они не зависят.
func fetchWeather(city: String) async -> String {
    await networkDelay()
    let data = ["Москва": "+5, облачно", "Сочи": "+14, солнечно", "Казань": "-3, снег"]
    return data[city] ?? "нет данных"
}

func fetchHeadlines(city: String) async -> [String] {
    await networkDelay()
    let data = [
        "Москва": ["В центре открыли новый каток", "Метро продлит работу в праздники"],
        "Сочи": ["Пляжи готовят к сезону"],
        "Казань": ["На дорогах гололёд", "Кремль открыл зимнюю выставку"]
    ]
    return data[city] ?? []
}

func fetchAlerts(city: String) async -> [String] {
    await networkDelay()
    let data = ["Казань": ["Сильный снегопад до вечера"]]
    return data[city] ?? []
}

// Напиши функцию loadHomeScreen(city:) — три запроса одновременно


// Проба: главный экран для Казани
let screen = await loadHomeScreen(city: "Казань")
print("Погода: \(screen.weather)")
print("Новостей: \(screen.headlines.count)")
print("Предупреждений: \(screen.alerts.count)")
```

## @solution
```swift
// Данные главного экрана
struct HomeScreen {
    let weather: String        // погода сейчас
    let headlines: [String]    // новости города
    let alerts: [String]       // предупреждения метеослужбы
}

// Имитация сети: соединение и загрузка, около 100 мс
func networkDelay() async {
    try? await Task.sleep(for: .milliseconds(50))   // соединение с сервером
    try? await Task.sleep(for: .milliseconds(50))   // загрузка данных
}

// Три готовых запроса. Друг от друга они не зависят.
func fetchWeather(city: String) async -> String {
    await networkDelay()
    let data = ["Москва": "+5, облачно", "Сочи": "+14, солнечно", "Казань": "-3, снег"]
    return data[city] ?? "нет данных"
}

func fetchHeadlines(city: String) async -> [String] {
    await networkDelay()
    let data = [
        "Москва": ["В центре открыли новый каток", "Метро продлит работу в праздники"],
        "Сочи": ["Пляжи готовят к сезону"],
        "Казань": ["На дорогах гололёд", "Кремль открыл зимнюю выставку"]
    ]
    return data[city] ?? []
}

func fetchAlerts(city: String) async -> [String] {
    await networkDelay()
    let data = ["Казань": ["Сильный снегопад до вечера"]]
    return data[city] ?? []
}

// Напиши функцию loadHomeScreen(city:) — три запроса одновременно
func loadHomeScreen(city: String) async -> HomeScreen {
    async let weather = fetchWeather(city: city)
    async let headlines = fetchHeadlines(city: city)
    async let alerts = fetchAlerts(city: city)

    return HomeScreen(weather: await weather, headlines: await headlines, alerts: await alerts)
}

// Проба: главный экран для Казани
let screen = await loadHomeScreen(city: "Казань")
print("Погода: \(screen.weather)")
print("Новостей: \(screen.headlines.count)")
print("Предупреждений: \(screen.alerts.count)")
```

## @output
```
Погода: -3, снег
Новостей: 2
Предупреждений: 1
```

## @tests
```swift
let __t_sochi = await loadHomeScreen(city: "Сочи")
__eq("Сочи: погода", __t_sochi.weather, "+14, солнечно", hint: "В weather кладётся ответ fetchWeather(city:) для переданного города")
__eq("Сочи: новости", __t_sochi.headlines, ["Пляжи готовят к сезону"], hint: "В headlines кладётся ответ fetchHeadlines(city:)")
__eq("Сочи: предупреждений нет", __t_sochi.alerts, [], hint: "В alerts кладётся ответ fetchAlerts(city:)")

let __t_moscow = await loadHomeScreen(city: "Москва")
__eq("Москва: погода", __t_moscow.weather, "+5, облачно")
__eq("Москва: две новости по порядку", __t_moscow.headlines, ["В центре открыли новый каток", "Метро продлит работу в праздники"])

let __t_kazan = await loadHomeScreen(city: "Казань")
__eq("Казань: предупреждение о снегопаде", __t_kazan.alerts, ["Сильный снегопад до вечера"], hint: "Проверь, что alerts берётся из fetchAlerts, а не из другого запроса")

let __t_unknown = await loadHomeScreen(city: "Тверь")
__eq("Неизвестный город: погоды нет", __t_unknown.weather, "нет данных")
__eq("Неизвестный город: новостей нет", __t_unknown.headlines, [])

let __t_clock = ContinuousClock()
var __t_best = Duration.seconds(100)
for _ in 1...3 {
    let __t_start = __t_clock.now
    _ = await loadHomeScreen(city: "Москва")
    let __t_elapsed = __t_clock.now - __t_start
    if __t_elapsed < __t_best { __t_best = __t_elapsed }
}
__ok("Три запроса идут одновременно: экран собирается быстрее, чем запросы по очереди", __t_best < .milliseconds(250), hint: "Похоже, запросы идут друг за другом (около 300 мс). Запусти каждый через async let, а await пиши только там, где нужны значения")
```

## @rules
- must: /(\basync\s+let\b[\s\S]*){3}/ :: Запусти все три запроса через `async let` — в коде их должно быть три.

## @hint1
Функция начинается как любая асинхронная: `func`, имя `loadHomeScreen`, параметр `city` типа `String`, слово `async`, стрелка и тип `HomeScreen`.

Внутри — три строки, по одной на запрос. Каждая начинается со слов `async let`, затем имя константы, знак равенства и вызов одной из готовых функций с городом. Перед самим вызовом `await` не пишут: запрос просто уходит в фон, а код сразу идёт дальше. Так все три запроса стартуют почти одновременно.

Последняя строка создаёт `HomeScreen` и возвращает его. Значения для его полей — твои три константы, и перед каждой стоит `await`: именно здесь функция дожидается ответов.

## @hint2
Два параллельных запроса на других данных:

```swift
async let rates = fetchCurrencyRates()
async let traffic = fetchTraffic(city: "Казань")

let screen = TrafficScreen(rates: await rates, traffic: await traffic)
```

У тебя запросов три, а результат нужно вернуть через `return`.

## @hint3
Допиши два запроса и возврат:

```swift
func loadHomeScreen(city: String) async -> HomeScreen {
    async let weather = fetchWeather(city: city)
    ___ headlines = fetchHeadlines(city: city)
    ___

    return HomeScreen(weather: await weather, headlines: ___, alerts: await alerts)
}
```

В первом пропуске — два слова, которые запускают запрос в фоне. Во втором — целая строка для предупреждений, по образцу первых двух. В третьем — ожидание новостей.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Строка `async let weather = fetchWeather(city: city)` запускает запрос погоды и не ждёт его: выполнение сразу идёт к следующей строке. Через долю миллисекунды стартует запрос новостей, ещё через долю — предупреждений. Теперь все три «едут» одновременно. В строке с `return` стоят три `await`. Функция ждёт первый ответ, но остальные запросы в это время тоже идут. Поэтому ко второму `await` второй ответ обычно уже готов. Общее время — около 100 мс, как у одного запроса.

**Почему результаты не перепутаются.** Каждый `async let` связан со своей константой. Даже если новости придут раньше погоды, они попадут в `headlines`, а погода — в `weather`. Порядок, в котором отвечает сервер, на результат не влияет.

**Почему не так.** Вариант `let weather = await fetchWeather(city: city)` тоже даёт правильные данные, но запросы идут по очереди: 100 + 100 + 100 мс. Проверка засекает время, и такой экран окажется в три раза медленнее. А если запустить через `async let` только два запроса, а третий оставить с обычным `await`, выиграешь только треть времени.

**Типичные ошибки:**

- `async let weather = await fetchWeather(city: city)` — ошибки не будет, но `await` справа лишний и сбивает с толку: кажется, что здесь ждут, хотя запрос просто уходит в фон;
- забыт `await` перед `weather` в строке с `return` — Swift напомнит, что значение может быть ещё не готово;
- `async let` применён к зависимым запросам. Здесь запросы независимые, но в жизни всегда стоит спросить себя: нужен ли одному ответ другого.
