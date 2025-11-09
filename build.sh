#!/bin/bash

# Build script for Unix/Linux/Mac systems
echo "Building frontend..."

# Navigate to frontend directory
cd frontend || exit 1

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Build the project
echo "Building React application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed! Please check the errors above."
    cd ..
    exit 1
fi

# Verify build output exists
STATIC_DIR="../backend/app/static"
if [ -d "$STATIC_DIR" ]; then
    if [ -f "$STATIC_DIR/index.html" ]; then
        echo "Build successful! Static files are in $STATIC_DIR"
    else
        echo "Warning: index.html not found in build output"
    fi
else
    echo "Error: Build output directory not found at $STATIC_DIR"
    cd ..
    exit 1
fi

# Navigate back to root
cd ..

echo ""
echo "Frontend build complete! The application is ready to be served from the backend."
echo "To start the application, run 'pipenv run dev' in the backend directory."
echo "The app will be available at http://localhost:5000"

