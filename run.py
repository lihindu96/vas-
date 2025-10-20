"""
Main application entry point
"""
import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Debug mode should only be enabled in development
    # Set FLASK_ENV=production for production deployments
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
