# branch very-simple-editor-assistant

- EntryEditor running on localhost port 3023

This is a very simple Entry Editor location app (https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#entry-editor) with the following functionalities:
- it handles two simple content type (it's enough that they have two short text fields each)
- it gets configured by reading a JSON object (**)
- for each content type the app re-labels all fields in the UI, using values specified in its JSON configuration
- PLEASE NOTE: we are not talking about renaming the fields in the content type !!!
- we are merely displaying the fields in the UI using as labels some values different from the real field names

-----------------------------------------
Tips for the exercise:
- as field editor use the SingleLineEditor provided in the Contentful SDK (NPM package '@contentful/field-editor-single-line')
- in order to display the renamed label of the field, it will be enough to prepend a Forma36 Heading before the SingleLineEditor

(**) Example JSON configuration object:
{
  "todo": {
    "what": "Quando",
    "why": "Motivo",
  },
  "article": {
    "title": "Titolo",
    "text": "Testo",
  }
}

In this case the content types have id 'todo' and 'article'
- todo has two short text fields with ids 'what' & 'why' that must be re-labeled as 'Quando' and 'Motivo' in the UI
- article has two short text fields with ids 'title' & 'text' that must be re-labeled as 'Titolo' and 'Testo' in the UI

This JSON object could be found inside a JSON file in the codebase. This would require a rebuild each time that the configuration file gets updated.

A more complex version could find the configuration inside a JSON media file stored in the environment where the app is running; this media should be loaded inside a useEffect of the EntryEditor.
