import re

with open('frontend/src/components/Editor/PropertiesRight.tsx', 'r') as f:
    content = f.read()

# We will use regex to find each template block.
# Pattern looks for `{/* NAME Template */}\n<button ... className={... layout === "..." ? ... : ...}>\n...\n</button>`
# Because regex with HTML is hard, we can use a simpler state machine to parse out the blocks.

lines = content.split('\n')
out_lines = []

i = 0
while i < len(lines):
    line = lines[i]
    
    # Detect start of a template block
    if '{/* ' in line and 'Template' in line and '*/}' in line and not 'Standard Templates' in line and not 'Premium Templates' in line:
        template_comment = line
        if i + 1 < len(lines) and '<button' in lines[i+1]:
            # Read until we find `</button>` matching this button
            button_lines = []
            j = i + 1
            button_depth = 0
            while j < len(lines):
                button_lines.append(lines[j])
                if '<button' in lines[j]:
                    button_depth += lines[j].count('<button')
                if '</button>' in lines[j]:
                    button_depth -= lines[j].count('</button>')
                j += 1
                if button_depth == 0:
                    break
            
            button_str = '\n'.join(button_lines)
            
            # Extract layout id and colors
            layout_match = re.search(r'captionStyle\.layout === "([^"]+)"', button_str)
            if layout_match:
                layout_id = layout_match.group(1)
                
                # Extract className from the outer button
                class_match = re.search(r'className={`([^`]+)`}', button_str)
                if class_match:
                    class_content = class_match.group(1)
                    # Replace `p-4` with `` because the padding moves to the inner button
                    class_content = class_content.replace('p-4 ', '')
                    
                    # Also replace text-left
                    class_content = class_content.replace('text-left ', '')
                    
                    # Extract the colors updated in onClick
                    colors = []
                    if 'updateStyle("primaryColor"' in button_str: colors.append(('Primary Color', 'primaryColor'))
                    if 'updateStyle("spotlightColor"' in button_str: colors.append(('Spotlight Color', 'spotlightColor'))
                    if 'updateStyle("emphasisColor"' in button_str: colors.append(('Emphasis Color', 'emphasisColor'))
                    if 'updateStyle("emphasisGlowColor"' in button_str: colors.append(('Glow Color', 'emphasisGlowColor'))
                    if 'updateStyle("dropShadowColor"' in button_str: colors.append(('Shadow Color', 'dropShadowColor'))
                    if 'updateStyle("bubblePrimaryColor"' in button_str: colors.append(('Text Color', 'bubblePrimaryColor'))
                    if 'updateStyle("bubbleSecondaryColor"' in button_str: colors.append(('Bubble BG', 'bubbleSecondaryColor'))
                    if 'updateStyle("bubbleTertiaryColor"' in button_str: colors.append(('Inner Text', 'bubbleTertiaryColor'))
                    
                    color_pickers = []
                    for label, key in colors:
                        color_pickers.append(f'                          <ColorPicker label="{label}" value={{captionStyle.{key} || "#FFFFFF"}} onChange={{val => updateStyle("{key}", val)}} />')
                    
                    color_pickers_str = '\n'.join(color_pickers)
                    
                    # Rewrite the button_lines to be inner button
                    # The outer tag becomes <div className={`...`}>
                    inner_button = button_str
                    # Remove the classname from inner button and replace it
                    inner_button = re.sub(r'className={`[^`]+`}', 'className="w-full p-4 text-left relative z-10"', inner_button)
                    
                    # Replace the first <button with <button type="button"
                    if '<button' in inner_button and not 'type="button"' in inner_button:
                        inner_button = inner_button.replace('<button', '<button type="button"', 1)
                    
                    replacement = f"""{template_comment}
                <div className={{`rounded-2xl border-2 transition-all relative overflow-hidden group ${{captionStyle.layout === "{layout_id}" ? {class_content.split('?')[1].split(':')[0].strip()} : {class_content.split(':')[1].strip()} }}`}}>
{inner_button}
                  <AnimatePresence>
                    {{captionStyle.layout === "{layout_id}" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-white/10 mt-2">
{color_pickers_str}
                        </div>
                      </motion.div>
                    )}}
                  </AnimatePresence>
                </div>"""
                    
                    out_lines.append(replacement)
                    i = j - 1
                else:
                    out_lines.append(line)
            else:
                out_lines.append(line)
        else:
            out_lines.append(line)
    else:
        out_lines.append(line)
    
    i += 1

# Let's remove the bottom Bubble settings since we moved them inside the button
content_out = '\n'.join(out_lines)

# Remove the old Bubble Style Settings block completely
start_idx = content_out.find('{/* Bubble Style Settings */}')
if start_idx != -1:
    end_idx = content_out.find('</AnimatePresence>', start_idx) + 18
    content_out = content_out[:start_idx] + content_out[end_idx:]

with open('frontend/src/components/Editor/PropertiesRight.tsx', 'w') as f:
    f.write(content_out)

print("Refactored templates!")
