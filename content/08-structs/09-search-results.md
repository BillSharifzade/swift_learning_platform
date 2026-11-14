---
title: Поиск жилья
concept: Итог модуля — свои типы, методы, static и опциональный результат
---

## @description

### Контекст
Финальная задача модуля — экран поиска. Гость выбирает город, число гостей и ночей, а по желанию ещё и бюджет на всю поездку. В ответ он видит список подходящих вариантов с полной суммой и пометку «Самый выгодный».

Продакт-менеджер прислала требования: «Жильё с рейтингом ниже 4.0 в выдачу не попадает. Это правило сервиса, и порог мы иногда меняем. А самый выгодный вариант считаем по сумме, которую гость реально заплатит, вместе с уборкой. На прошлой неделе значок висел на студии за 3200 в ночь. С уборкой она вышла дороже соседней квартиры за 3600, и гости писали в поддержку».

### Что пригодится
Нового в этой задаче нет — только инструменты модуля и тех, что были до него:

- **Своя структура** с хранимыми свойствами и автоматическим инициализатором. Свойство `var` опционального типа без значения при создании можно пропустить — в нём будет `nil`.
- **`static var`** — одно значение на весь тип. Внутри методов к нему обращаются через имя типа: `SearchFilter.minRating`.
- **Методы**, которые читают свойства своего экземпляра и вызывают методы других значений: внутри метода фильтра можно написать `listing.totalPrice(nights: nights)`.
- **Короткий `if let`**: `if let maxTotalPrice { ... }` — внутри блока это уже обычное число.
- **Сбор массива в цикле**: пустой массив-переменная, `for`, `if` и `append`.
- **Поиск лучшего в цикле.** Заведи переменную-опционал, например `var best: Listing? = nil`, — «пока никого не выбрали». Дальше для каждого элемента: если `best` ещё пуст — запомни элемент; если не пуст — сравни с запомненным и замени, только если новый строго лучше. После цикла в `best` либо победитель, либо `nil`, когда сравнивать было не с чем. Поэтому и результат такого метода — опционал.
- **Семантика значений.** Экран делает копию фильтра, `var withBudget = filter`, и задаёт бюджет только в копии. Исходный фильтр остаётся без бюджета.

### Задача
В редакторе есть готовая структура `Listing` — объявление из каталога. Её свойства по порядку: `title`, `city`, `pricePerNight`, `cleaningFee`, `maxGuests`, `rating` (`Double`). Метод `totalPrice(nights:)` считает полную стоимость проживания: ночи по цене плюс уборка один раз. Ниже — заготовка `Catalog` и код экрана.

1. Объяви структуру `SearchFilter`:
   - статическую переменную `minRating` со значением `4.0` — порог рейтинга для всей выдачи;
   - свойства именно в таком порядке: `city` (`String`), `guests` (`Int`), `nights` (`Int`) — через `let`;
   - последним — свойство `maxTotalPrice` типа `Int?` через `var`, без значения. Это бюджет на всё проживание, `nil` — бюджет не задан.
2. Добавь в `SearchFilter` метод `matches(_:)`: принимает `Listing` без метки и возвращает `Bool`. Объявление подходит, когда выполнено всё сразу:
   - его город совпадает с `city`;
   - его `maxGuests` не меньше `guests`;
   - его `rating` не ниже `SearchFilter.minRating`;
   - если бюджет задан — `totalPrice(nights:)` этого объявления для `nights` ночей не больше `maxTotalPrice`. Если бюджет `nil`, цена не важна.
3. В `Catalog` допиши метод `search(_:)`: он возвращает все подходящие под фильтр объявления из `listings` в том же порядке, в каком они лежат в каталоге.
4. В `Catalog` допиши метод `cheapest(_:)`: он возвращает самое выгодное из подходящих объявлений — с наименьшей полной стоимостью проживания (с уборкой), а не с наименьшей ценой за ночь. Если подходящих нет, результат — `nil`. Если у нескольких вариантов одинаковая стоимость, выгодным считается тот, что раньше в каталоге.

Код экрана менять не нужно. Сейчас он не собирается: в нём есть `SearchFilter`, которой пока нет.

### Пример
```swift
let filter = SearchFilter(city: "Казань", guests: 2, nights: 3)
catalog.search(filter)      // студия (11100), лофт (16800), апартаменты (10800)
catalog.cheapest(filter)    // апартаменты: 10800 меньше 11100, хотя за ночь студия дешевле

var withBudget = filter
withBudget.maxTotalPrice = 12000
catalog.search(withBudget)  // студия и апартаменты: лофт за 16800 не влезает в бюджет
```

Экран должен вывести:

```text
Поиск: Казань, гостей: 2, ночей: 3
- Студия у набережной: 11100 руб.
- Лофт на Кремлёвской: 16800 руб.
- Апартаменты с видом на реку: 10800 руб.
Самый выгодный: Апартаменты с видом на реку

Поиск: Казань, гостей: 2, ночей: 3
Бюджет: до 12000 руб.
- Студия у набережной: 11100 руб.
- Апартаменты с видом на реку: 10800 руб.
Самый выгодный: Апартаменты с видом на реку

Поиск: Казань, гостей: 5, ночей: 2
Ничего не найдено
```

## @starter
```swift
// Объявление из каталога. Эта структура уже готова
struct Listing {
    let title: String
    let city: String
    let pricePerNight: Int
    let cleaningFee: Int
    let maxGuests: Int
    let rating: Double

    func totalPrice(nights: Int) -> Int {
        pricePerNight * nights + cleaningFee
    }
}

// 1. Объяви структуру SearchFilter: порог рейтинга, город, гости, ночи и бюджет
// 2. Добавь в неё метод matches(_:)


struct Catalog {
    let listings: [Listing]

    // 3. Верни подходящие объявления в порядке каталога
    func search(_ filter: SearchFilter) -> [Listing] {
        return []
    }

    // 4. Верни самое выгодное из подходящих (по полной стоимости) или nil
    func cheapest(_ filter: SearchFilter) -> Listing? {
        return nil
    }
}

let catalog = Catalog(listings: [
    Listing(title: "Студия у набережной", city: "Казань", pricePerNight: 3200, cleaningFee: 1500, maxGuests: 2, rating: 4.9),
    Listing(title: "Лофт на Кремлёвской", city: "Казань", pricePerNight: 5600, cleaningFee: 0, maxGuests: 4, rating: 4.7),
    Listing(title: "Дом у озера", city: "Выборг", pricePerNight: 7400, cleaningFee: 2500, maxGuests: 6, rating: 4.8),
    Listing(title: "Комната в центре", city: "Казань", pricePerNight: 2100, cleaningFee: 500, maxGuests: 1, rating: 4.6),
    Listing(title: "Квартира у вокзала", city: "Казань", pricePerNight: 2600, cleaningFee: 0, maxGuests: 3, rating: 3.8),
    Listing(title: "Апартаменты с видом на реку", city: "Казань", pricePerNight: 3600, cleaningFee: 0, maxGuests: 2, rating: 4.5)
])

// Экран выдачи. Этот код уже готов — менять его не нужно
func showResults(for filter: SearchFilter) {
    print("Поиск: \(filter.city), гостей: \(filter.guests), ночей: \(filter.nights)")
    if let budget = filter.maxTotalPrice {
        print("Бюджет: до \(budget) руб.")
    }
    for listing in catalog.search(filter) {
        print("- \(listing.title): \(listing.totalPrice(nights: filter.nights)) руб.")
    }
    if let best = catalog.cheapest(filter) {
        print("Самый выгодный: \(best.title)")
    } else {
        print("Ничего не найдено")
    }
    print("")
}

let filter = SearchFilter(city: "Казань", guests: 2, nights: 3)
showResults(for: filter)

// Гость указал бюджет: меняем копию фильтра, исходный остаётся без бюджета
var withBudget = filter
withBudget.maxTotalPrice = 12000
showResults(for: withBudget)

showResults(for: SearchFilter(city: "Казань", guests: 5, nights: 2))
```

## @solution
```swift
// Объявление из каталога. Эта структура уже готова
struct Listing {
    let title: String
    let city: String
    let pricePerNight: Int
    let cleaningFee: Int
    let maxGuests: Int
    let rating: Double

    func totalPrice(nights: Int) -> Int {
        pricePerNight * nights + cleaningFee
    }
}

// 1. Объяви структуру SearchFilter: порог рейтинга, город, гости, ночи и бюджет
// 2. Добавь в неё метод matches(_:)
struct SearchFilter {
    static var minRating = 4.0

    let city: String
    let guests: Int
    let nights: Int
    var maxTotalPrice: Int?

    func matches(_ listing: Listing) -> Bool {
        guard listing.city == city && listing.maxGuests >= guests && listing.rating >= SearchFilter.minRating else {
            return false
        }
        if let maxTotalPrice {
            return listing.totalPrice(nights: nights) <= maxTotalPrice
        }
        return true
    }
}

struct Catalog {
    let listings: [Listing]

    // 3. Верни подходящие объявления в порядке каталога
    func search(_ filter: SearchFilter) -> [Listing] {
        var found: [Listing] = []
        for listing in listings {
            if filter.matches(listing) {
                found.append(listing)
            }
        }
        return found
    }

    // 4. Верни самое выгодное из подходящих (по полной стоимости) или nil
    func cheapest(_ filter: SearchFilter) -> Listing? {
        var best: Listing? = nil
        for listing in search(filter) {
            if let current = best {
                if listing.totalPrice(nights: filter.nights) < current.totalPrice(nights: filter.nights) {
                    best = listing
                }
            } else {
                best = listing
            }
        }
        return best
    }
}

let catalog = Catalog(listings: [
    Listing(title: "Студия у набережной", city: "Казань", pricePerNight: 3200, cleaningFee: 1500, maxGuests: 2, rating: 4.9),
    Listing(title: "Лофт на Кремлёвской", city: "Казань", pricePerNight: 5600, cleaningFee: 0, maxGuests: 4, rating: 4.7),
    Listing(title: "Дом у озера", city: "Выборг", pricePerNight: 7400, cleaningFee: 2500, maxGuests: 6, rating: 4.8),
    Listing(title: "Комната в центре", city: "Казань", pricePerNight: 2100, cleaningFee: 500, maxGuests: 1, rating: 4.6),
    Listing(title: "Квартира у вокзала", city: "Казань", pricePerNight: 2600, cleaningFee: 0, maxGuests: 3, rating: 3.8),
    Listing(title: "Апартаменты с видом на реку", city: "Казань", pricePerNight: 3600, cleaningFee: 0, maxGuests: 2, rating: 4.5)
])

// Экран выдачи. Этот код уже готов — менять его не нужно
func showResults(for filter: SearchFilter) {
    print("Поиск: \(filter.city), гостей: \(filter.guests), ночей: \(filter.nights)")
    if let budget = filter.maxTotalPrice {
        print("Бюджет: до \(budget) руб.")
    }
    for listing in catalog.search(filter) {
        print("- \(listing.title): \(listing.totalPrice(nights: filter.nights)) руб.")
    }
    if let best = catalog.cheapest(filter) {
        print("Самый выгодный: \(best.title)")
    } else {
        print("Ничего не найдено")
    }
    print("")
}

let filter = SearchFilter(city: "Казань", guests: 2, nights: 3)
showResults(for: filter)

// Гость указал бюджет: меняем копию фильтра, исходный остаётся без бюджета
var withBudget = filter
withBudget.maxTotalPrice = 12000
showResults(for: withBudget)

showResults(for: SearchFilter(city: "Казань", guests: 5, nights: 2))
```

## @output
```
Поиск: Казань, гостей: 2, ночей: 3
- Студия у набережной: 11100 руб.
- Лофт на Кремлёвской: 16800 руб.
- Апартаменты с видом на реку: 10800 руб.
Самый выгодный: Апартаменты с видом на реку

Поиск: Казань, гостей: 2, ночей: 3
Бюджет: до 12000 руб.
- Студия у набережной: 11100 руб.
- Апартаменты с видом на реку: 10800 руб.
Самый выгодный: Апартаменты с видом на реку

Поиск: Казань, гостей: 5, ночей: 2
Ничего не найдено
```

## @tests
```swift
func __t_titles(_ listings: [Listing]) -> [String] {
    var titles: [String] = []
    for listing in listings {
        titles.append(listing.title)
    }
    return titles
}
func __t_title(_ listing: Listing?) -> String {
    listing?.title ?? "(nil - ничего не найдено)"
}

__eq("Порог SearchFilter.minRating равен 4.0", SearchFilter.minRating, 4.0, hint: "Объяви в SearchFilter статическую переменную: static var minRating = 4.0")
SearchFilter.minRating = 4.0

let __t_studio = Listing(title: "Студия у парка", city: "Самара", pricePerNight: 3000, cleaningFee: 3000, maxGuests: 2, rating: 4.6)
let __t_flat = Listing(title: "Квартира на набережной", city: "Самара", pricePerNight: 3500, cleaningFee: 0, maxGuests: 3, rating: 4.0)
let __t_loft = Listing(title: "Лофт у вокзала", city: "Самара", pricePerNight: 2000, cleaningFee: 0, maxGuests: 4, rating: 3.9)
let __t_house = Listing(title: "Дом с садом", city: "Тольятти", pricePerNight: 1500, cleaningFee: 0, maxGuests: 6, rating: 4.9)
let __t_room = Listing(title: "Комната у театра", city: "Самара", pricePerNight: 1800, cleaningFee: 200, maxGuests: 1, rating: 4.8)
let __t_catalog = Catalog(listings: [__t_studio, __t_flat, __t_loft, __t_house, __t_room])
let __t_empty = Catalog(listings: [])

let __t_two = SearchFilter(city: "Самара", guests: 2, nights: 2)
__ok("Новый фильтр без бюджета: maxTotalPrice равно nil", __t_two.maxTotalPrice == nil, hint: "Объяви бюджет как var maxTotalPrice: Int? без значения")
__eq("matches: гостей ровно столько, сколько вмещает жильё (2 из 2)", __t_two.matches(__t_studio), true, hint: "maxGuests должен быть не меньше guests: сравнивай через >=")
__eq("matches: рейтинг ровно 4.0 подходит", __t_two.matches(__t_flat), true, hint: "Рейтинг не ниже порога: сравнивай через >= SearchFilter.minRating")
__eq("matches: рейтинг 3.9 не подходит", __t_two.matches(__t_loft), false, hint: "Объявления с рейтингом ниже SearchFilter.minRating в выдачу не попадают")
__eq("matches: другой город не подходит", __t_two.matches(__t_house), false, hint: "Город объявления должен совпадать с city фильтра")
__eq("matches: жильё на одного гостя не подходит для двоих", __t_two.matches(__t_room), false, hint: "Если maxGuests меньше guests, объявление не подходит")

__eq("matches: бюджет ровно равен стоимости (9000 при бюджете 9000) — подходит", SearchFilter(city: "Самара", guests: 2, nights: 2, maxTotalPrice: 9000).matches(__t_studio), true, hint: "Стоимость не больше бюджета: сравнивай через <=. Стоимость — totalPrice(nights: nights), с уборкой")
__eq("matches: стоимость 9000 при бюджете 8999 — не подходит", SearchFilter(city: "Самара", guests: 2, nights: 2, maxTotalPrice: 8999).matches(__t_studio), false, hint: "Если бюджет задан, полная стоимость проживания должна быть не больше maxTotalPrice")
__eq("matches: бюджет учитывает уборку (6000 за ночи + 3000 уборка больше 8000)", SearchFilter(city: "Самара", guests: 2, nights: 2, maxTotalPrice: 8000).matches(__t_studio), false, hint: "Сравнивай с бюджетом listing.totalPrice(nights: nights) — сумму вместе с уборкой")
__eq("matches: бюджет учитывает число ночей фильтра", SearchFilter(city: "Самара", guests: 2, nights: 5, maxTotalPrice: 15000).matches(__t_flat), false, hint: "Стоимость считается для nights ночей из фильтра: 5 ночей по 3500 — это 17500")

__eq("search: подходящие объявления в порядке каталога", __t_titles(__t_catalog.search(__t_two)), ["Студия у парка", "Квартира на набережной"], hint: "Пройди по listings циклом и добавляй в результат те, для которых filter.matches(...) вернул true. Если не сходится, проверь и сам matches")
__eq("search: один гость, одна ночь — три варианта", __t_titles(__t_catalog.search(SearchFilter(city: "Самара", guests: 1, nights: 1))), ["Студия у парка", "Квартира на набережной", "Комната у театра"])
__eq("search: с бюджетом 8000 остаётся одна квартира", __t_titles(__t_catalog.search(SearchFilter(city: "Самара", guests: 2, nights: 2, maxTotalPrice: 8000))), ["Квартира на набережной"])
__eq("search: в городе без жилья — пустой список", __t_titles(__t_catalog.search(SearchFilter(city: "Казань", guests: 2, nights: 2))), [], hint: "Если ничего не подошло, верни пустой массив")
__eq("search: пустой каталог — пустой список", __t_titles(__t_empty.search(__t_two)), [])

__eq("cheapest: на 2 ночи квартира (7000) выгоднее студии (6000 + 3000 уборка)", __t_title(__t_catalog.cheapest(__t_two)), "Квартира на набережной", hint: "Сравнивай полную стоимость listing.totalPrice(nights: filter.nights), а не цену за ночь")
__eq("cheapest: на 10 ночей студия (33000) выгоднее квартиры (35000)", __t_title(__t_catalog.cheapest(SearchFilter(city: "Самара", guests: 2, nights: 10))), "Студия у парка", hint: "Стоимость считается для числа ночей из фильтра: filter.nights")
__eq("cheapest: самые дешёвые варианты не подходят по рейтингу и городу", __t_title(__t_catalog.cheapest(SearchFilter(city: "Самара", guests: 1, nights: 1))), "Комната у театра", hint: "Выбирай только среди подходящих под фильтр объявлений — например, среди результата search(filter)")
__eq("cheapest: в бюджет 7000 ровно влезает квартира", __t_title(__t_catalog.cheapest(SearchFilter(city: "Самара", guests: 2, nights: 2, maxTotalPrice: 7000))), "Квартира на набережной")
__ok("cheapest: бюджет 6999 — ничего не найдено, nil", __t_catalog.cheapest(SearchFilter(city: "Самара", guests: 2, nights: 2, maxTotalPrice: 6999)) == nil, hint: "Если подходящих объявлений нет, cheapest должен вернуть nil")
__ok("cheapest: в городе без жилья — nil", __t_catalog.cheapest(SearchFilter(city: "Казань", guests: 2, nights: 2)) == nil)
__ok("cheapest: пустой каталог — nil", __t_empty.cheapest(__t_two) == nil, hint: "Начни с var best: Listing? = nil — если цикл не выполнится ни разу, вернётся nil")

let __t_sameA = Listing(title: "Студия на Садовой", city: "Пермь", pricePerNight: 4000, cleaningFee: 0, maxGuests: 2, rating: 4.5)
let __t_sameB = Listing(title: "Квартира у моста", city: "Пермь", pricePerNight: 3500, cleaningFee: 500, maxGuests: 2, rating: 4.7)
let __t_tie = SearchFilter(city: "Пермь", guests: 2, nights: 1)
__eq("cheapest: при равной стоимости (4000 и 4000) выбирается первое в каталоге", __t_title(Catalog(listings: [__t_sameA, __t_sameB]).cheapest(__t_tie)), "Студия на Садовой", hint: "Сравнивай полную стоимость с уборкой и заменяй запомненный вариант, только если новый строго дешевле: через <, а не <=")
__eq("cheapest: каталог в другом порядке — снова первое в каталоге", __t_title(Catalog(listings: [__t_sameB, __t_sameA]).cheapest(__t_tie)), "Квартира у моста", hint: "Сравнивай полную стоимость с уборкой и заменяй запомненный вариант, только если новый строго дешевле: через <, а не <=")

SearchFilter.minRating = 3.9
__eq("Порог снизили до 3.9 — лофт с рейтингом 3.9 стал самым выгодным", __t_title(__t_catalog.cheapest(__t_two)), "Лофт у вокзала", hint: "В matches сравнивай рейтинг с SearchFilter.minRating, а не с числом 4.0")
SearchFilter.minRating = 4.5
__eq("Порог подняли до 4.5 — квартира с рейтингом 4.0 пропала из выдачи", __t_titles(__t_catalog.search(__t_two)), ["Студия у парка"], hint: "В matches сравнивай рейтинг с SearchFilter.minRating, а не с числом 4.0")
SearchFilter.minRating = 4.0

__ok("На экране исходный фильтр остался без бюджета", filter.maxTotalPrice == nil)
```

## @hint1
Задача большая, но состоит из знакомых шагов. Иди по комментариям сверху вниз.

Структура фильтра. Сначала статическая переменная с порогом рейтинга, потом три свойства через `let` и последним — бюджет: `var`, тип — целое число со знаком вопроса, без значения. Порядок свойств важен: экран создаёт фильтр автоматическим инициализатором.

Метод `matches`. Параметр без метки — это объявление. Удобно начать с `guard`: в его условии три требования через «и» — город, гости, рейтинг. Если хоть одно не выполнено, верни `false`. К порогу обращайся через имя типа. Дальше бюджет: если он задан (короткий `if let`), верни результат сравнения полной стоимости объявления с бюджетом. Полную стоимость посчитает метод самого объявления — передай ему число ночей из фильтра. Если бюджета нет, верни `true`.

Метод `search`. Заведи пустой массив-переменную, пройди циклом по `listings` и добавляй те объявления, для которых фильтр говорит «подходит». Верни массив вместо заглушки.

Метод `cheapest`. Заведи переменную-опционал для лучшего варианта, равную `nil`. Пройди циклом по результату `search`. Если лучший вариант уже есть — сравни полные стоимости и замени, только если текущий строго дешевле. Если ещё нет — запомни текущий. После цикла верни переменную.

## @hint2
Два ключевых места — бюджет, которого может не быть, и выбор лучшего варианта в цикле. Вот они на других данных:

```swift
// Опциональное ограничение: если его нет, подходит всё
if let maxMinutes {
    return host.responseMinutes <= maxMinutes
}
return true
```

```swift
// Выбор лучшего: сначала "никого", потом сравниваем
var fastest: Host? = nil
for host in hosts {
    if let current = fastest {
        if host.responseMinutes < current.responseMinutes {
            fastest = host
        }
    } else {
        fastest = host
    }
}
return fastest
```

У тебя вместо времени ответа сравнивается полная стоимость: `listing.totalPrice(nights: filter.nights)`. А перебирать удобно не все `listings`, а только результат `search(filter)`.

## @hint3
Каркас готов, заполни пропуски:

```swift
struct SearchFilter {
    static var minRating = 4.0

    let city: String
    let guests: Int
    let nights: Int
    var maxTotalPrice: ___

    func matches(_ listing: Listing) -> Bool {
        guard listing.city == city && listing.maxGuests >= guests && listing.rating >= ___ else {
            return false
        }
        if let maxTotalPrice {
            return listing.totalPrice(nights: nights) <= maxTotalPrice
        }
        return true
    }
}
```

```swift
    func search(_ filter: SearchFilter) -> [Listing] {
        var found: [Listing] = []
        for listing in listings {
            if filter.___(listing) {
                found.append(listing)
            }
        }
        return found
    }

    func cheapest(_ filter: SearchFilter) -> Listing? {
        var best: Listing? = nil
        for listing in search(filter) {
            if let current = best {
                if listing.totalPrice(nights: filter.nights) ___ current.totalPrice(nights: filter.nights) {
                    best = listing
                }
            } else {
                best = ___
            }
        }
        return best
    }
```

По порядку: тип бюджета, которого может не быть; порог рейтинга через имя типа; метод фильтра, который проверяет одно объявление; знак сравнения «строго дешевле»; что запомнить, когда лучшего варианта ещё нет.

## @hint4
Вот готовое решение:

{{solution}}

**Как устроен фильтр.** `SearchFilter` — обычная структура: три свойства через `let` и бюджет через `var`. Бюджет опциональный и без значения, поэтому экран может создать фильтр без него — `SearchFilter(city: "Казань", guests: 2, nights: 3)`, — а потом задать его в копии. Порог `minRating` объявлен как `static`: он один на всю выдачу, и если продакт поменяет его в одном месте, поменяется поиск везде.

**Как работает `matches`.** `guard` отсекает всё, что точно не подходит: чужой город, мало мест, низкий рейтинг. Дальше остаётся вопрос денег. Короткий `if let maxTotalPrice` разворачивает бюджет: если он есть, ответ — сравнение полной стоимости с бюджетом. Если бюджета нет, блок пропускается, и объявление подходит. Полную стоимость считает метод `Listing`, а не формула в фильтре: правило «уборка один раз» записано в одном месте.

**Как работает `cheapest`.** Переменная `best` начинает с `nil` — «пока никого». Первое подходящее объявление сразу становится лучшим. Каждое следующее сравнивается с ним по полной стоимости и заменяет его, только если оно строго дешевле. Поэтому при равных суммах побеждает то, что раньше в каталоге. Если подходящих не нашлось, цикл не выполнится ни разу, и метод вернёт `nil`. Экран это учитывает: `if let best` либо показывает название, либо пишет «Ничего не найдено».

**Почему по полной стоимости.** Студия у набережной стоит 3200 в ночь, апартаменты — 3600. Но за три ночи студия с уборкой выходит 11100, а апартаменты — 10800. Гость платит именно полную сумму, поэтому значок «Самый выгодный» получают апартаменты.

**Типичные ошибки:**

- сравнение `pricePerNight` вместо `totalPrice(nights:)` — на экране значок окажется у студии;
- `<=` вместо `<` в `cheapest` — при равной стоимости победит последний вариант, а не первый;
- `let maxTotalPrice: Int?` — экран не сможет создать фильтр без бюджета и не сможет задать бюджет в копии;
- `rating > SearchFilter.minRating` — жильё с рейтингом ровно 4.0 пропадёт из выдачи;
- `minRating` без `SearchFilter.` — внутри метода Swift не найдёт это имя: оно принадлежит типу, а не экземпляру;
- внутри методов `Catalog` используется глобальная `catalog` вместо свойства `listings` — на экране всё сойдётся, а на другом каталоге нет.
