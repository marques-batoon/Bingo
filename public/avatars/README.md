# Avatar images

Drop your own images here to replace the initials placeholders:

```
public/avatars/<category>/<id>.webp
```

Example: `public/avatars/pokemon/pikachu.webp`. The `category` and `id` for each avatar are in `src/data/avatars.json`.

- Square images, about 256×256, `.webp`.
- Use only images you have the rights to use.
- Hollywood and Filipino Stars already have freely licensed Wikimedia photos; their credits are in `CREDITS.md` and in the app (Home → Photo credits). If you replace one, update `src/data/avatarCredits.json` too.
- Missing files are fine: the app shows the initials placeholder until the file exists.
- Fruit and Vegetables use emoji and need no files (an image you add with the same path is not used for them).
