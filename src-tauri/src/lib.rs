use std::{
    env, fs,
    path::{Path, PathBuf},
};

#[tauri::command]
fn save_markdown_file(filename: String, contents: String) -> Result<String, String> {
    let mut directory = downloads_dir()
        .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    directory.push("Stellaris Notes");

    fs::create_dir_all(&directory)
        .map_err(|error| format!("Could not create notes folder: {error}"))?;

    let filename = markdown_filename(&filename);
    let path = unique_file_path(&directory, &filename);

    fs::write(&path, contents).map_err(|error| format!("Could not save markdown file: {error}"))?;

    Ok(path.display().to_string())
}

fn downloads_dir() -> Option<PathBuf> {
    env::var_os("HOME").map(|home| PathBuf::from(home).join("Downloads"))
}

fn markdown_filename(value: &str) -> String {
    let mut name = value
        .chars()
        .map(|character| match character {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            character if character.is_control() => '-',
            character => character,
        })
        .collect::<String>()
        .trim()
        .trim_matches('.')
        .to_string();

    if name.is_empty() {
        name = "Untitled Note".to_string();
    }

    if !name.to_lowercase().ends_with(".md") {
        name.push_str(".md");
    }

    name
}

fn unique_file_path(directory: &Path, filename: &str) -> PathBuf {
    let original = Path::new(filename);
    let stem = original
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("Untitled Note");
    let extension = original
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("md");
    let mut path = directory.join(filename);
    let mut index = 2;

    while path.exists() {
        path = directory.join(format!("{stem} ({index}).{extension}"));
        index += 1;
    }

    path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_markdown_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
