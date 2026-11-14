---
title: Скрытый тип
concept: some и any — непрозрачный тип и «коробка» для любого типа
---

## @description

### Контекст
В «Каркасе» есть ценники — маленькие компоненты, которые превращают цену в текст для экрана. Все они соответствуют протоколу `PriceTag`: обычный ценник, ценник со скидкой и ценник «Бесплатно». Ими пользуются «Ярмарка» и «Гардероб».

Коллега набросал черновик: ценник в корзине, выбор ценника по скидке, ценник по умолчанию, предпросмотр для дизайнера и витрину, где рядом стоят разные ценники. Но Swift черновик не собирает. Тимлид смотрит и улыбается: «Он перепутал `some` и `any`. В трёх местах всё решает одно слово перед `PriceTag`. Почини, допиши две заглушки — и заодно разберёшься, когда какое слово писать».

### Новое в Swift
Протокол можно использовать как тип двумя способами, и они заметно отличаются. Пример — значки на карточке товара:

```swift
protocol Badge {
    var label: String { get }
}

struct NewBadge: Badge {
    var label: String { return "Новинка" }
}

struct HitBadge: Badge {
    let week: Int
    var label: String { return "Хит недели \(week)" }
}
```

**`any Badge` — коробка для любого значка.** Ты встречала `any` в модуле про протоколы. Это значение **любого** типа, который соответствует `Badge`. Сейчас внутри один тип, через минуту может оказаться другой:

```swift
var badge: any Badge = NewBadge()
badge = HitBadge(week: 12)                          // можно: коробка та же, содержимое другое
let badges: [any Badge] = [NewBadge(), HitBadge(week: 3)]   // разные типы в одном массиве
```

**`some Badge` — один конкретный тип, имя которого скрыто.** Компилятор точно знает, какой это тип, но тому, кто пользуется значением, его не называет:

```swift
func promoBadge() -> some Badge {
    return HitBadge(week: 12)
}
```

Приложение видит только «какой-то значок» и может читать `label`. Зато библиотека завтра может вернуть другой тип — и ни одно приложение не придётся переписывать. Но тип обязан быть **один** на всю функцию:

```swift
func badge(isNew: Bool) -> some Badge {
    if isNew {
        return NewBadge()
    }
    return HitBadge(week: 1)    // ошибка: в одной функции два разных типа
}
```

С переменной то же самое: `some` выбирает тип один раз, по первому значению.

```swift
var promo: some Badge = NewBadge()
promo = HitBadge(week: 12)      // ошибка: тип уже выбран — это NewBadge
```

Если нужны разные типы — это работа для `any`: замени `some` на `any`, и код соберётся.

**`some` у параметра** — короткая запись обобщённой функции. Эти две строки означают одно и то же:

```swift
func render(_ badge: some Badge) -> String { ... }
func render<B: Badge>(_ badge: B) -> String { ... }
```

При каждом вызове передаётся значение одного конкретного типа, и Swift подставляет его, как в любом дженерике.

**Что выбрать.** Начинай с `some`: компилятор знает настоящий тип и работает с ним напрямую. `any` нужен, когда в одном месте действительно живут разные типы: в массиве, в переменной, которая меняет содержимое, в функции, которая возвращает то одно, то другое.

> 💡 Коробку `any` можно буквально измерить. `MemoryLayout.size(ofValue: promoBadge())` — 8 байт: столько занимает `HitBadge` с одним `Int`. А то же значение в `any Badge` занимает 40 байт: коробка хранит ещё и сведения о том, что лежит внутри.

### Задача
В редакторе есть протокол `PriceTag`, три ценника — `RegularTag`, `SaleTag`, `FreeTag` — и черновик коллеги. Ценники не меняй. Имена, параметры и логику выбора в черновике тоже не меняй: чинить нужно только слова `some` и `any` и заглушки.

1. Нажми «Проверить», ничего не меняя, и прочитай ошибку. Переменная `cartTag` — ценник в корзине. Сначала он обычный, а после ввода промокода становится ценником со скидкой, то есть меняет тип. Объяви её так, чтобы это стало возможно: `any PriceTag`.
2. Функция `tag(discount:)` в разных ветках возвращает ценники разных типов. Её результат должен быть `any PriceTag`.
3. `standardTag()` всегда возвращает один и тот же тип, а коллега объявил результат как `any PriceTag` — лишняя коробка. Замени на `some PriceTag`. Проверка это измерит: значение без коробки занимает ровно столько памяти, сколько сам `RegularTag`.
4. Допиши `preview(_:prices:)` вместо заглушки: верни текст ценника `tag` для каждой цены из `prices` по порядку.
5. Допиши `showcase(price:tags:)` вместо заглушки: верни текст каждого ценника из `tags` для цены `price` по порядку.

### Пример
```swift
cartTag.text(for: 1000)              // "850 руб. (-15%)" — ценник уже поменялся

tag(discount: 0).text(for: 2000)     // "2000 руб."
tag(discount: 25).text(for: 2000)    // "1500 руб. (-25%)"
tag(discount: 100).text(for: 2000)   // "Бесплатно"

standardTag().text(for: 990)         // "990 руб."

preview(SaleTag(percent: 10), prices: [1000, 2500])
// ["900 руб. (-10%)", "2250 руб. (-10%)"]

showcase(price: 2000, tags: [RegularTag(), SaleTag(percent: 25), FreeTag()])
// ["2000 руб.", "1500 руб. (-25%)", "Бесплатно"]
```

## @starter
```swift
// Ценники «Каркаса» — не меняй их
protocol PriceTag {
    func text(for price: Int) -> String
}

struct RegularTag: PriceTag {
    func text(for price: Int) -> String {
        return "\(price) руб."
    }
}

struct SaleTag: PriceTag {
    let percent: Int

    func text(for price: Int) -> String {
        let newPrice = price * (100 - percent) / 100
        return "\(newPrice) руб. (-\(percent)%)"
    }
}

struct FreeTag: PriceTag {
    func text(for price: Int) -> String {
        return "Бесплатно"
    }
}

// Черновик коллеги

// 1. Ценник в корзине: после ввода промокода он меняется
var cartTag: some PriceTag = RegularTag()
cartTag = SaleTag(percent: 15)

// 2. Ценник по размеру скидки
func tag(discount: Int) -> some PriceTag {
    if discount <= 0 {
        return RegularTag()
    }
    if discount >= 100 {
        return FreeTag()
    }
    return SaleTag(percent: discount)
}

// 3. Ценник по умолчанию: тип всегда один и тот же
func standardTag() -> any PriceTag {
    return RegularTag()
}

// 4. Предпросмотр одного ценника на разных ценах
func preview(_ tag: some PriceTag, prices: [Int]) -> [String] {
    return []   // заглушка: замени своим кодом
}

// 5. Витрина: одна цена, ценники разных типов
func showcase(price: Int, tags: [any PriceTag]) -> [String] {
    return []   // заглушка: замени своим кодом
}
```

## @solution
```swift
// Ценники «Каркаса» — не меняй их
protocol PriceTag {
    func text(for price: Int) -> String
}

struct RegularTag: PriceTag {
    func text(for price: Int) -> String {
        return "\(price) руб."
    }
}

struct SaleTag: PriceTag {
    let percent: Int

    func text(for price: Int) -> String {
        let newPrice = price * (100 - percent) / 100
        return "\(newPrice) руб. (-\(percent)%)"
    }
}

struct FreeTag: PriceTag {
    func text(for price: Int) -> String {
        return "Бесплатно"
    }
}

// Черновик коллеги

// 1. Ценник в корзине: после ввода промокода он меняется
var cartTag: any PriceTag = RegularTag()
cartTag = SaleTag(percent: 15)

// 2. Ценник по размеру скидки
func tag(discount: Int) -> any PriceTag {
    if discount <= 0 {
        return RegularTag()
    }
    if discount >= 100 {
        return FreeTag()
    }
    return SaleTag(percent: discount)
}

// 3. Ценник по умолчанию: тип всегда один и тот же
func standardTag() -> some PriceTag {
    return RegularTag()
}

// 4. Предпросмотр одного ценника на разных ценах
func preview(_ tag: some PriceTag, prices: [Int]) -> [String] {
    return prices.map { tag.text(for: $0) }
}

// 5. Витрина: одна цена, ценники разных типов
func showcase(price: Int, tags: [any PriceTag]) -> [String] {
    return tags.map { $0.text(for: price) }
}
```

## @tests
```swift
__ok("cartTag: после промокода в корзине ценник SaleTag", cartTag is SaleTag, hint: "Строку с присваиванием SaleTag(percent: 15) не удаляй: ценник в корзине должен поменяться")
__eq("cartTag: текст ценника в корзине для 1000 руб.", cartTag.text(for: 1000), "850 руб. (-15%)")
__ok("tag: скидка 0 — обычный ценник RegularTag", tag(discount: 0) is RegularTag, hint: "Логику выбора ценника менять не нужно — только тип результата")
__ok("tag: отрицательная скидка — тоже RegularTag", tag(discount: -5) is RegularTag)
__ok("tag: скидка 25 — ценник SaleTag", tag(discount: 25) is SaleTag)
__ok("tag: скидка 1 — уже SaleTag", tag(discount: 1) is SaleTag)
__ok("tag: скидка 99 — ещё SaleTag", tag(discount: 99) is SaleTag)
__ok("tag: скидка 100 — ценник FreeTag", tag(discount: 100) is FreeTag)
__ok("tag: скидка 150 — тоже FreeTag", tag(discount: 150) is FreeTag)
__eq("tag: текст для скидки 25 на 2000 руб.", tag(discount: 25).text(for: 2000), "1500 руб. (-25%)")
__eq("tag: текст для скидки 100", tag(discount: 100).text(for: 2000), "Бесплатно")

__eq("standardTag: обычный ценник на 990 руб.", standardTag().text(for: 990), "990 руб.", hint: "standardTag() должна возвращать RegularTag()")
__ok("standardTag: внутри именно RegularTag", standardTag() is RegularTag)
__eq("standardTag: результат без коробки, размером ровно с RegularTag (в байтах)", MemoryLayout.size(ofValue: standardTag()), MemoryLayout<RegularTag>.size, hint: "40 байт — это размер коробки any. У RegularTag нет свойств, поэтому сам он занимает 0 байт. Объяви результат как some PriceTag, и коробка исчезнет")

__eq("preview: скидка 10% на две цены", preview(SaleTag(percent: 10), prices: [1000, 2500]), ["900 руб. (-10%)", "2250 руб. (-10%)"])
__eq("preview: обычный ценник", preview(RegularTag(), prices: [990, 1490, 75]), ["990 руб.", "1490 руб.", "75 руб."])
__eq("preview: пустой список цен", preview(FreeTag(), prices: []), [], hint: "Для пустого массива цен верни пустой массив")
__eq("preview: ценник из standardTag()", preview(standardTag(), prices: [500]), ["500 руб."])

struct __t_RoundTag: PriceTag {
    func text(for price: Int) -> String {
        return "около \(price / 100 * 100) руб."
    }
}
__eq("preview: ценник проверки, которого нет в твоём коде", preview(__t_RoundTag(), prices: [1490, 2050]), ["около 1400 руб.", "около 2000 руб."], hint: "preview должна работать с любым ценником, соответствующим PriceTag")

__eq("showcase: три разных ценника на одной цене", showcase(price: 2000, tags: [RegularTag(), SaleTag(percent: 25), FreeTag()]), ["2000 руб.", "1500 руб. (-25%)", "Бесплатно"])
__eq("showcase: ценники в другом порядке", showcase(price: 1000, tags: [FreeTag(), __t_RoundTag(), SaleTag(percent: 50)]), ["Бесплатно", "около 1000 руб.", "500 руб. (-50%)"], hint: "Тексты должны идти в том же порядке, что и ценники в массиве")
__eq("showcase: ценники, выбранные функцией tag", showcase(price: 3000, tags: [tag(discount: 0), tag(discount: 10)]), ["3000 руб.", "2700 руб. (-10%)"])
__eq("showcase: пустая витрина", showcase(price: 3000, tags: []), [])
```

## @rules
- must: /var\s+cartTag\s*:\s*any\s+PriceTag\b/ :: `cartTag` меняет тип — сначала `RegularTag`, потом `SaleTag`. Такой переменной нужна коробка: `var cartTag: any PriceTag`.
- must: /cartTag\s*=\s*SaleTag\s*\(\s*percent\s*:\s*15\s*\)/ :: Строку `cartTag = SaleTag(percent: 15)` оставь на месте: ценник в корзине должен поменяться.
- must: /func\s+tag\s*\(\s*discount\s*:\s*Int\s*\)\s*->\s*any\s+PriceTag\b/ :: Функция `tag(discount:)` возвращает ценники разных типов, поэтому её результат должен быть `any PriceTag`.
- must: /func\s+standardTag\s*\(\s*\)\s*->\s*some\s+PriceTag\b/ :: `standardTag()` всегда возвращает один и тот же тип — объяви результат как `some PriceTag`.
- must: /func\s+preview\s*\(\s*_\s+\w+\s*:\s*some\s+PriceTag\b/ :: Первый параметр `preview` объяви как `some PriceTag`: при каждом вызове передаётся один конкретный ценник.
- must: /tags\s*:\s*\[\s*any\s+PriceTag\s*\]/ :: Параметр `tags` у `showcase` — массив ценников разных типов: `[any PriceTag]`.

## @hint1
Иди по ошибкам по очереди — каждая подсказывает следующий шаг.

Первая ошибка — про `cartTag`. Переменная объявлена через `some`, то есть с одним скрытым, но уже выбранным типом: тем, что лежал в ней с самого начала. Следующая строка пытается положить туда ценник другого типа. Переменной, которая меняет тип, нужна коробка — другое слово перед `PriceTag`.

Когда исправишь, Swift покажет вторую ошибку — про `tag(discount:)`. Причина та же: три ветки возвращают три разных типа, а `some` обещает один. Снова замени одно слово.

Третье место ошибки не вызывает, но его поймает проверка. `standardTag` всегда возвращает обычный ценник, коробка ему не нужна. Здесь слово нужно поменять в обратную сторону.

Остались две заглушки. В `preview` один ценник и много цен: преобразуй массив цен методом из модуля про замыкания так, чтобы для каждой цены получился текст этого ценника. В `showcase` наоборот: одна цена и много ценников. Преобразуй массив ценников: каждый ценник даёт текст для этой цены.

## @hint2
Где какое слово нужно, видно по тому, сколько типов встречается в одном месте:

```swift
var cartTag: any PriceTag = RegularTag()   // тип меняется — нужна коробка
cartTag = SaleTag(percent: 15)

func standardTag() -> some PriceTag {      // тип всегда один — коробка не нужна
    return RegularTag()
}
```

А заглушки заменяются преобразованием массива через `map`:

```swift
return prices.map { tag.text(for: $0) }
```

## @hint3
Заполни пропуски:

```swift
var cartTag: ___ PriceTag = RegularTag()
cartTag = SaleTag(percent: 15)

func tag(discount: Int) -> ___ PriceTag {
    if discount <= 0 {
        return RegularTag()
    }
    if discount >= 100 {
        return FreeTag()
    }
    return SaleTag(percent: discount)
}

func standardTag() -> ___ PriceTag {
    return RegularTag()
}

func preview(_ tag: some PriceTag, prices: [Int]) -> [String] {
    return prices.map { tag.text(for: $0) }
}

func showcase(price: Int, tags: [any PriceTag]) -> [String] {
    return tags.map { ___ }
}
```

В первых двух пропусках — слово для «разные типы в одном месте». В третьем — для «один тип, имя скрыто». В последнем — текст очередного ценника для цены `price`.

## @hint4
Вот готовое решение:

{{solution}}

**`cartTag` — это `any`.** Сначала в переменной `RegularTag`, потом `SaleTag`. Запись `some PriceTag` выбирает тип один раз — по первому значению, и положить потом значение другого типа нельзя. `any PriceTag` — коробка: внутри может лежать любой ценник, и содержимое можно менять.

**`tag(discount:)` — тоже `any`.** В разных ветках функция возвращает `RegularTag`, `FreeTag` и `SaleTag`. `some` обещает один тип на всю функцию, поэтому черновик не собирался. С `any` каждая ветка кладёт в коробку свой ценник. Проверка заглядывает внутрь коробки и убеждается, что при скидке 0 там `RegularTag`, а при 100 — `FreeTag`.

**`standardTag()` — это `some`.** Тип всегда один, коробка не нужна. Swift возвращает сам `RegularTag`, без обёртки, — проверка измеряет результат и видит, что он занимает столько же памяти, сколько `RegularTag`, а не 40 байт коробки. При этом приложения не знают настоящего типа, и «Каркас» сможет поменять его, ничего не сломав.

**Заглушки.** `some PriceTag` у параметра `preview` — короткая запись `preview<T: PriceTag>(_ tag: T, ...)`: при каждом вызове передаётся один конкретный ценник. `[any PriceTag]` в `showcase` — массив коробок: только так в одном массиве уживаются ценники разных типов. В обоих случаях `map` превращает массив в массив текстов того же размера и в том же порядке.

**Правило на будущее.** Начинай с `some`. Переходи на `any`, когда в одном месте действительно живут разные типы.

**Типичные ошибки:**

- удалена строка `cartTag = SaleTag(percent: 15)` — ошибка исчезла, но ценник в корзине так и не поменялся;
- в `tag(discount:)` логика переписана так, чтобы везде возвращать `SaleTag`: собирается, но «Бесплатно» превращается в «0 руб. (-100%)»;
- в `preview` перепутаны цена и ценник: `$0.text(for: tag)` — у числа нет метода `text`.
