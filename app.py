from flask import Flask, request, jsonify, send_from_directory
import subprocess, os, shutil
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'tempFolder'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def serve_index():
    return send_from_directory('front-end', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('front-end', path)

@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    if 'input_file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})

    file = request.files['input_file']
    summary_types = request.form['summary_types'].split(',')
    output_file = request.form['output_file']

    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})

    # Save the file
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    result_lines = []

    try:
        for summary_type in summary_types:
            cmd = f'python3.11 main.py --input_file {file_path} --summary_type {summary_type} --output_file {output_file}'
            subprocess.run(cmd, shell=True, check=True)
            output_path = os.path.join('results/', summary_type + '_' + output_file)
            if os.path.exists(output_path):
                with open(output_path, 'r') as f:
                    result_lines.append(f'--- {summary_type.capitalize()} Summary --- \n')
                    result_lines.extend(f.readlines())
                    result_lines.append("\n\n\n")  
            else:
                result_lines.append(f'{summary_type.capitalize()} result not found.')

        response_data = {'success': True, 'result': ''.join(result_lines)}
        file_list = os.listdir(app.config['UPLOAD_FOLDER'])
        for f in file_list:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return jsonify(response_data)
    except subprocess.CalledProcessError as e:
        file_list = os.listdir(app.config['UPLOAD_FOLDER'])
        for f in file_list:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return jsonify({'success': False, 'error': str(e)})
    except :
        file_list = os.listdir(app.config['UPLOAD_FOLDER'])
        for f in file_list:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return jsonify({'success': False, 'error': "Error"})

if __name__ == '__main__':
    app.run(debug=True)
