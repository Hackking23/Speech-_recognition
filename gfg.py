from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr

app = Flask(__name__)
CORS(app)


@app.route('/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        audio_data = request.data
        r = sr.Recognizer()
        with sr.AudioData(audio_data) as source:
            r.adjust_for_ambient_noise(source)
            text = r.recognize_sphinx(source)
            text = text.lower()
            print(text)
            return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run()
