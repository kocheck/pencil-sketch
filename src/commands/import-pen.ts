import { convertPenDocument } from '../converters/pen-to-sketch/index'
import type { PenDocument } from '../types/pen'

export default function importPen(context: any): void {
  // 1. Open a native file picker filtered to .pen files
  const panel = NSOpenPanel.openPanel()
  panel.setCanChooseFiles(true)
  panel.setCanChooseDirectories(false)
  panel.setAllowsMultipleSelection(false)
  panel.setAllowedFileTypes(['pen'])
  panel.setTitle('Import .pen file')
  panel.setPrompt('Import')

  const response = panel.runModal()
  if (response !== NSModalResponseOK) return

  // 2. Read the file as a UTF-8 string
  const url = panel.URL()
  if (!url) return
  const filePath: string = url.path()
  const raw = NSString.stringWithContentsOfFile_encoding_error(
    filePath,
    NSUTF8StringEncoding,
    null,
  )

  if (!raw) {
    showAlert('Import failed', `Could not read file: ${filePath}`)
    return
  }

  // 3. Parse JSON
  let doc: PenDocument
  try {
    doc = JSON.parse(raw.toString())
  } catch (e) {
    showAlert('Import failed', 'The selected file is not valid .pen JSON.')
    return
  }

  // 4. Insert into the current Sketch page
  const sketch = require('sketch')
  const document = sketch.getSelectedDocument()
  if (!document) {
    showAlert('Import failed', 'No Sketch document is open.')
    return
  }
  const page = document.selectedPage

  convertPenDocument(doc, page)

  // 5. Notify user
  sketch.UI.message('✓ .pen file imported successfully')
}

function showAlert(title: string, message: string): void {
  const alert = NSAlert.alloc().init()
  alert.setMessageText(title)
  alert.setInformativeText(message)
  alert.runModal()
}
