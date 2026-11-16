# Записи окружения

Записи включены локально. Интернет во время игры не используется.

| Звук | Автор и источник | Лицензия | Обработка |
| --- | --- | --- | --- |
| Кукушка | Barracuda1983, [Cuculus canorus song](https://commons.wikimedia.org/wiki/File:Cuculus_canorus_song.ogg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Фрагмент 00:04–00:11, подавление фонового шума, фильтрация, плавные края, нормализация громкости, mono 32 kHz Vorbis. |
| Собака | Amada44, [Barking of a dog](https://commons.wikimedia.org/wiki/File:Barking_of_a_dog.ogg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Фильтрация для ощущения расстояния, плавные края, нормализация громкости, mono 32 kHz Vorbis. |

Оригиналы сохранены в `sources/`. Обработанные записи `cuckoo.ogg`, `dog.ogg` и их копии в `ambient-samples.js` распространяются по CC BY-SA 3.0 с указанием авторов выше. Авторы исходных записей не связаны с проектом и не заявляли о его поддержке.

`ambient-samples.js` упаковывается командой `node scripts/pack-audio.mjs`: это те же OGG в Base64 для декодирования Web Audio при запуске через `file://`.
Шелест, прочие птицы, сверчки, шаги и полив синтезируются игрой. Три реплики бабушки — временная озвучка Windows Irina.
