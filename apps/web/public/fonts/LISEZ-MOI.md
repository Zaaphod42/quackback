# Les polices servies par le portail

## Glass Antiqua

Le mot « diafane » et les titres. Fichier copie depuis Diafane, **avec sa
licence** : `glass-antiqua/OFL.txt`. Elle est sous Open Font License, qui
autorise la redistribution tant que la licence voyage avec le fichier.

## Google Sans : elle n'est PAS ici, et elle ne doit pas y revenir

La police du TEXTE de Diafane a ete copiee ici le 2026-09-23, puis **retiree le
2026-09-24**.

La raison est ce depot : c'est un FORK PUBLIC d'un projet sous AGPL-3.0. Or
Google Sans est la police de marque de Google. Elle n'est pas distribuee sur
Google Fonts, aucun fichier de licence ne l'accompagne chez Diafane (la ou
`gotu` a bien son OFL), et rien ne dit qu'on ait le droit de la redistribuer.
La servir depuis son propre site est une chose ; la poser dans un depot public
sous une licence qui couvre tout l'arbre en est une autre.

Le portail la charge donc depuis `diafane.com`, ou elle est deja servie. Cela
demande, cote Diafane, un en-tete `Access-Control-Allow-Origin` sur les
reponses de `/fonts/` : sans lui, le navigateur refuse une police venue d'un
autre domaine, et le texte du portail retombe en silence sur Helvetica ou Arial.

**Avant de reposer un fichier de police ici, demander sa licence.** Une police
qui change de depot emporte sa licence, ou elle ne change pas de depot.
