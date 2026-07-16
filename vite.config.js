import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function shortcutKeysPlugin() {
  const underlineFirstLetter = (content, word, char) => {
    const regex = new RegExp('\\b' + word + '\\b', 'g');
    return content.replace(regex, `<u>${char}</u>${word.substring(1)}`);
  };

  return {
    name: 'vite-plugin-shortcut-keys',
    transform(code, id) {
      if (!id.endsWith('.jsx') || !id.includes('/src/pages/')) {
        return null;
      }

      let transformed = code;

      // Match <button ...> ... </button>
      transformed = transformed.replace(/<button([^>]*?)>([\s\S]*?)<\/button>/g, (match, attrs, content) => {
        let newContent = content;
        let newAttrs = attrs;
        let matched = false;

        // 1. Dynamic Update / Create
        if (content.includes("'Update'") && content.includes("'Create'")) {
          newContent = newContent
            .replace(/'Update'/g, '<><u>U</u>pdate</>')
            .replace(/'Create'/g, '<><u>C</u>reate</>');
          const varMatch = content.match(/(\w*edit\w*)\s*!==?\s*null|(\w*edit\w*)\s*\?/i);
          const editVar = varMatch ? (varMatch[1] || varMatch[2]) : 'editId';
          newAttrs += ` data-shortcut-key={${editVar} !== null ? 'u' : 'c'}`;
          matched = true;
        }
        // 2. Dynamic Update / Save
        else if (content.includes("'Update'") && content.includes("'Save'")) {
          newContent = newContent
            .replace(/'Update'/g, '<><u>U</u>pdate</>')
            .replace(/'Save'/g, '<><u>S</u>ave</>');
          const varMatch = content.match(/(\w*edit\w*)\s*!==?\s*null|(\w*edit\w*)\s*\?/i);
          const editVar = varMatch ? (varMatch[1] || varMatch[2]) : 'editingId';
          newAttrs += ` data-shortcut-key={${editVar} !== null ? 'u' : 's'}`;
          matched = true;
        }
        // 3. Dynamic Update / Submit
        else if (content.includes("'Update'") && content.includes("'Submit'")) {
          newContent = newContent
            .replace(/'Update'/g, '<><u>U</u>pdate</>')
            .replace(/'Submit'/g, '<><u>S</u>ubmit</>');
          const varMatch = content.match(/(\w*edit\w*)\s*!==?\s*null|(\w*edit\w*)\s*\?/i);
          const editVar = varMatch ? (varMatch[1] || varMatch[2]) : 'editId';
          newAttrs += ` data-shortcut-key={${editVar} ? 'u' : 's'}`;
          matched = true;
        }
        // 4. Static Save
        else if (/>\s*Save\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Save', 'S');
          newAttrs += ` data-shortcut-key="s"`;
          matched = true;
        }
        // 5. Static Submit
        else if (/>\s*Submit\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Submit', 'S');
          newAttrs += ` data-shortcut-key="s"`;
          matched = true;
        }
        // 6. Static Create
        else if (/>\s*Create\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Create', 'C');
          newAttrs += ` data-shortcut-key="c"`;
          matched = true;
        }
        // 7. Static Update
        else if (/>\s*Update\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Update', 'U');
          newAttrs += ` data-shortcut-key="u"`;
          matched = true;
        }
        // 8. Static Edit
        else if (/>\s*Edit\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Edit', 'E');
          newAttrs += ` data-shortcut-key="e"`;
          matched = true;
        }
        // 9. Static Display All
        else if (/>\s*Display All\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Display All', 'D');
          newAttrs += ` data-shortcut-key="d"`;
          matched = true;
        }
        // 10. Static Details
        else if (/>\s*Details\s*</.test('>' + content + '<')) {
          newContent = underlineFirstLetter(newContent, 'Details', 'D');
          newAttrs += ` data-shortcut-key="d"`;
          matched = true;
        }

        if (matched) {
          const titleMatch = attrs.match(/title="([^"]+)"/);
          if (titleMatch) {
            const existingTitle = titleMatch[1];
            if (!existingTitle.includes('Alt+')) {
              const staticKey = newAttrs.match(/data-shortcut-key="([^"]+)"/);
              if (staticKey) {
                newAttrs = newAttrs.replace(`title="${existingTitle}"`, `title="${existingTitle} (Alt+${staticKey[1].toUpperCase()})"`);
              }
            }
          }
          return `<button${newAttrs}>${newContent}</button>`;
        }
        return match;
      });

      return {
        code: transformed,
        map: null
      };
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), shortcutKeysPlugin()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
  