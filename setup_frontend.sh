#!/bin/bash

# 🚀 Frontend Setup Script
echo "🎓 Setting up React Frontend for Educational Quiz Platform"
echo "============================================================"

# Navigate to coding directory
cd ~/Desktop/coding

# Clone the frontend repository
echo "📥 Cloning React frontend..."
if [ ! -d "CodeVita" ]; then
    git clone https://github.com/Komalsain12/CodeVita.git
    echo "✅ Frontend cloned successfully"
else
    echo "⚠️ CodeVita directory already exists"
fi

# Navigate to frontend directory
cd CodeVita

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install additional packages for API integration
echo "🔗 Installing API integration packages..."
npm install axios

# Create .env file for API configuration
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_NAME=Educational Quiz API
EOF

# Copy the sample component
echo "📝 Adding sample quiz component..."
mkdir -p src/components
cp ../lmsQuizz/QuizGenerator.js src/components/

# Display integration instructions
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🔧 Next Steps:"
echo "1. Start your FastAPI backend (should be running on port 8000)"
echo "2. Start the React frontend:"
echo "   cd CodeVita"
echo "   npm start"
echo ""
echo "3. Add the QuizGenerator component to your App.js:"
echo "   import QuizGenerator from './components/QuizGenerator';"
echo "   // Then use <QuizGenerator /> in your JSX"
echo ""
echo "4. Test the integration:"
echo "   - Upload a PDF file"
echo "   - Generate questions"
echo "   - Try different difficulty levels"
echo ""
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🌐 Frontend will run on: http://localhost:3000"
echo ""
echo "Happy coding! 🚀"