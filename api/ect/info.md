> ## Заметка

/etc/nginx/sites-available/ — это просто «библиотека» всех ваших виртуальных хостов (конфигов).\
/etc/nginx/sites-enabled/ — здесь лежат только активные сайты, но на самом деле это символьные ссылки (ярлыки) на файлы из sites-available.\
)

## Опции:

-a (archive) — рекурсивно копирует всё, сохраняя права, временные метки и т. д.\
/. . (точка после слеша) гарантирует копирование всех файлов (включая скрытые), но без самой папки sites-available.\
проверка: nginx -t\
перезагрузка: sudo systemctl reload nginx

\[Команда:]\
cp -a /etc/nginx/sites-available/. .

## Опции:

-f — если в целевой папке уже есть файл default, он будет перезаписан без дополнительных вопросов.

-\[Команда:]\
cp -f synoptic /etc/nginx/sites-available/

```
cp -f synoptic /etc/nginx/sites-available/

```

Нажмите `Ctrl+Shift+P` (или `⌘+Shift+P` на macOS).

&#x20;

* Начните вводить «Preferences: Open Settings (JSON)» и выберите эту команду.
* Откроется файл настроек пользователя `settings.json` прямо в редакторе.

Делает белый фон для определеных типов файлов
"theme-by-language.themes": {
"\*": "Default Dark+",
"markdown": "Default Light+"
}
