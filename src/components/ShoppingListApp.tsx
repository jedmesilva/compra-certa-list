import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bookmark, Store, ShoppingBasket, Search, Mic, Camera, FileText, Trash, X, Wand2, Plus, ShoppingCart } from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function ShoppingListApp() {
  const [items, setItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeSearchText, setStoreSearchText] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showStoreSearchResults, setShowStoreSearchResults] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [cameraPressed, setCameraPressed] = useState(false);
  
  // Estados para contentEditable
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const currentWordRef = useRef({ word: '', range: null });

  const availableStores = [
    { id: 1, name: 'Dia Supermercado', address: 'Rua São Pedro 25, Santa Lúcia', category: 'Supermercado', image: 'https://via.placeholder.com/40x40/ff6b35/ffffff?text=DIA' },
    { id: 2, name: 'Farmácia Araújo', address: 'Av. Bias Fortes 180, Centro', category: 'Farmácia', image: 'https://via.placeholder.com/40x40/4285f4/ffffff?text=FA' },
    { id: 3, name: 'Padaria São José', address: 'Rua da Bahia 450, Lourdes', category: 'Padaria', image: 'https://via.placeholder.com/40x40/34a853/ffffff?text=PSJ' },
    { id: 4, name: 'Extra Supermercado', address: 'Av. Afonso Pena 1000, Centro', category: 'Supermercado', image: 'https://via.placeholder.com/40x40/ea4335/ffffff?text=EXT' },
    { id: 5, name: 'Drogasil', address: 'Rua Curitiba 832, Centro', category: 'Farmácia', image: 'https://via.placeholder.com/40x40/9c27b0/ffffff?text=DS' },
    { id: 6, name: 'Pão de Açúcar', address: 'Rua Paraíba 1122, Funcionários', category: 'Supermercado', image: 'https://via.placeholder.com/40x40/ff9800/ffffff?text=PDA' },
  ];

  const availableProducts = [
    { id: 1, name: 'Arroz Branco 5kg', brand: 'Tio João', price: 12.99, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=ARZ' },
    { id: 2, name: 'Feijão Preto 1kg', brand: 'Camil', price: 8.50, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=FEJ' },
    { id: 3, name: 'Açúcar Cristal 1kg', brand: 'União', price: 4.20, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=AÇU' },
    { id: 4, name: 'Leite Integral 1L', brand: 'Nestle', price: 5.80, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=LEI' },
    { id: 5, name: 'Óleo de Soja 900ml', brand: 'Liza', price: 6.90, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=OLE' },
    { id: 6, name: 'Macarrão Espaguete 500g', brand: 'Barilla', price: 7.30, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=MAC' },
    { id: 7, name: 'Café Torrado 500g', brand: 'Pilão', price: 18.90, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=CAF' },
    { id: 8, name: 'Banana Prata 1kg', brand: 'Natural', price: 3.50, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=BAN' },
    { id: 9, name: 'Tomate', brand: 'Natural', price: 4.80, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=TOM' },
    { id: 10, name: 'Cebola', brand: 'Natural', price: 2.90, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=CEB' },
    { id: 11, name: 'Batata', brand: 'Natural', price: 3.20, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=BAT' },
    { id: 12, name: 'Pão Francês', brand: 'Padaria', price: 0.80, image: 'https://via.placeholder.com/60x60/e5e7eb/6b7280?text=PAO' },
  ];

  // Filtrar estabelecimentos baseado na busca
  const filteredStores = storeSearchText 
    ? availableStores.filter(store => 
        store.name.toLowerCase().includes(storeSearchText.toLowerCase()) ||
        store.address.toLowerCase().includes(storeSearchText.toLowerCase()) ||
        store.category.toLowerCase().includes(storeSearchText.toLowerCase())
      ).slice(0, 6)
    : availableStores.slice(0, 6);

  // Filtrar produtos baseado na busca
  const filteredProducts = searchText 
    ? availableProducts.filter(product => 
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 6)
    : [];

  // Funções para contentEditable
  const getCaretPosition = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    return {
      x: rect.left - editorRect.left,
      y: rect.bottom - editorRect.top + 5
    };
  };

  const getCurrentWord = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return { word: '', range: null };
    
    const range = selection.getRangeAt(0).cloneRange();
    const textNode = range.startContainer;
    
    if (textNode.nodeType !== Node.TEXT_NODE) {
      return { word: '', range: null };
    }
    
    const text = textNode.textContent;
    const offset = range.startOffset;
    
    // Encontrar início da palavra
    let start = offset;
    while (start > 0 && /\S/.test(text[start - 1])) {
      start--;
    }
    
    // Encontrar fim da palavra
    let end = offset;
    while (end < text.length && /\S/.test(text[end])) {
      end++;
    }
    
    const word = text.slice(start, end);
    
    // Criar range para a palavra completa
    const wordRange = document.createRange();
    wordRange.setStart(textNode, start);
    wordRange.setEnd(textNode, end);
    
    return { word: word.toLowerCase(), range: wordRange };
  };

  const handleEditorInput = () => {
    const { word, range } = getCurrentWord();
    currentWordRef.current = { word, range };
    
    if (word.length >= 2) {
      const filtered = availableProducts.filter(product => 
        (product.name.toLowerCase().includes(word) || product.brand.toLowerCase().includes(word)) &&
        !selectedProducts.some(p => p.id === product.id)
      );
      
      if (filtered.length > 0) {
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
        setSelectedSuggestion(0);
        
        const position = getCaretPosition();
        if (position) {
          setSuggestionPosition(position);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleEditorKeyDown = (e) => {
    if (showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          addProductFromEditor(suggestions[selectedSuggestion]);
          break;
          
        case ' ':
          setShowSuggestions(false);
          break;
          
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    }
  };

  const createProductSpan = (product) => {
    const span = document.createElement('span');
    span.className = 'product-highlight bg-blue-100 text-blue-800 px-1 rounded font-medium mx-0.5';
    span.setAttribute('data-product-id', product.id);
    span.textContent = product.name;
    span.contentEditable = false;
    
    // Adicionar botão de remoção
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '×';
    removeBtn.className = 'ml-1 text-blue-600 hover:text-red-600 text-xs';
    removeBtn.onclick = (e) => {
      e.preventDefault();
      removeProductFromEditor(span, product);
    };
    span.appendChild(removeBtn);
    
    return span;
  };

  const addProductFromEditor = (product) => {
    const { range } = currentWordRef.current;
    if (!range) return;
    
    // Remover conteúdo da palavra atual
    range.deleteContents();
    
    // Inserir span do produto
    const productSpan = createProductSpan(product);
    range.insertNode(productSpan);
    
    // Adicionar espaço após o produto
    const space = document.createTextNode(' ');
    range.setStartAfter(productSpan);
    range.insertNode(space);
    
    // Posicionar cursor após o espaço
    const selection = window.getSelection();
    selection.removeAllRanges();
    range.setStartAfter(space);
    range.collapse(true);
    selection.addRange(range);
    
    // Adicionar produto às listas
    addItem(product);
    setSelectedProducts(prev => [...prev, product]);
    setShowSuggestions(false);
    editorRef.current.focus();
  };

  const removeProductFromEditor = (span, product) => {
    span.remove();
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    removeItem(product.id);
  };

  const autoIdentifyProducts = () => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.textContent.toLowerCase();
    const words = text.split(/\s+/);
    const foundProducts = [];
    
    // Procurar por produtos no texto
    availableProducts.forEach(product => {
      const productName = product.name.toLowerCase();
      const productWords = productName.split(/\s+/);
      
      // Verificar se todas as palavras do produto estão no texto
      const hasAllWords = productWords.every(word => 
        words.some(textWord => textWord.includes(word.slice(0, 3)))
      );
      
      if (hasAllWords && !selectedProducts.some(p => p.id === product.id)) {
        foundProducts.push(product);
      }
    });
    
    // Limpar editor e recriar com produtos destacados
    const originalText = editorRef.current.textContent;
    let processedText = originalText;
    
    foundProducts.forEach(product => {
      const productName = product.name.toLowerCase();
      const regex = new RegExp(`\\b${productName.split(' ')[0]}\\b`, 'gi');
      processedText = processedText.replace(regex, `<PRODUCT:${product.id}>`);
    });
    
    // Reconstruir o editor com produtos destacados
    editorRef.current.innerHTML = '';
    const parts = processedText.split(/(<PRODUCT:\d+>)/);
    
    parts.forEach(part => {
      if (part.startsWith('<PRODUCT:')) {
        const productId = parseInt(part.match(/\d+/)[0]);
        const product = foundProducts.find(p => p.id === productId);
        if (product) {
          const productSpan = createProductSpan(product);
          editorRef.current.appendChild(productSpan);
          addItem(product);
        }
      } else if (part.trim()) {
        const textNode = document.createTextNode(part);
        editorRef.current.appendChild(textNode);
      }
    });
    
    setSelectedProducts(prev => [...prev, ...foundProducts]);
  };

  const clearAllProducts = () => {
    if (!editorRef.current) return;
    
    const productSpans = editorRef.current.querySelectorAll('.product-highlight');
    productSpans.forEach(span => {
      const productId = span.getAttribute('data-product-id');
      const product = selectedProducts.find(p => p.id === parseInt(productId));
      if (product) {
        const textNode = document.createTextNode(product.name);
        span.parentNode.replaceChild(textNode, span);
        removeItem(product.id);
      }
    });
    setSelectedProducts([]);
  };

  useEffect(() => {
    if (filteredProducts.length > 0) {
      setSelectedProductIndex(0);
    } else {
      setSelectedProductIndex(-1);
    }
  }, [filteredProducts.length]);

  useEffect(() => {
    if (filteredStores.length > 0) {
      setSelectedStoreIndex(0);
    } else {
      setSelectedStoreIndex(-1);
    }
  }, [filteredStores.length]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';
      
      recognitionInstance.onstart = () => {
        console.log('Reconhecimento iniciado');
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setSearchText(currentTranscript.trim());
        
        if (currentTranscript.trim()) {
          setShowSearchResults(true);
        }
        
        // Se o usuário disse "confirmar", "ok", "sim", "esse mesmo" ou "adicionar", adiciona o produto selecionado
        const confirmWords = ['confirmar', 'ok', 'sim', 'esse mesmo', 'adicionar', 'esse', 'confirma'];
        const spokenText = finalTranscript.toLowerCase();
        
        if (confirmWords.some(word => spokenText.includes(word))) {
          if (filteredProducts.length > 0 && selectedProductIndex >= 0) {
            addItem(filteredProducts[selectedProductIndex]);
            setSearchText('');
            setShowSearchResults(false);
            setSelectedProductIndex(-1);
            stopListening();
          }
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        console.log('Reconhecimento finalizado');
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.warn('Reconhecimento de voz não suportado neste navegador');
    }
  }, [filteredProducts, selectedProductIndex]);

  // Prevenir paste de HTML
  useEffect(() => {
    const handlePaste = (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    };
    
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('paste', handlePaste);
      return () => editor.removeEventListener('paste', handlePaste);
    }
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      setActiveTab('voice');
      setSearchText('');
      setShowSearchResults(false);
      try {
        recognition.start();
        console.log('Tentando iniciar reconhecimento...');
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setActiveTab('search');
    }
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCameraClick = () => {
    setCameraPressed(true);
    setActiveTab('camera');
    
    setTimeout(() => setCameraPressed(false), 200);
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        console.log('Imagem selecionada:', file.name);
        
        setTimeout(() => {
          alert(`Imagem "${file.name}" foi selecionada! Aqui você pode implementar o processamento da imagem.`);
          setActiveTab('search');
        }, 500);
      } else {
        alert('Por favor, selecione apenas arquivos de imagem.');
      }
    }
    
    event.target.value = '';
  };

  const selectStore = (store) => {
    setSelectedStore(store);
    setStoreSearchText('');
    setShowStoreSearchResults(false);
    setSelectedStoreIndex(-1);
  };

  const selectStoreFromSearch = () => {
    if (filteredStores.length > 0 && selectedStoreIndex >= 0) {
      selectStore(filteredStores[selectedStoreIndex]);
    }
  };

  const clearStoreSelection = () => {
    setSelectedStore(null);
  };

  const addItem = (product) => {
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        quantity: 1,
        image: product.image
      };
      setItems([...items, newItem]);
    }
  };

  const addItemFromSearch = () => {
    if (filteredProducts.length > 0 && selectedProductIndex >= 0) {
      addItem(filteredProducts[selectedProductIndex]);
      setSearchText('');
      setShowSearchResults(false);
      setSelectedProductIndex(-1);
    }
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRequestPurchase = () => {
    if (items.length === 0) return;
    
    // Aqui você pode implementar a lógica de solicitar compra
    console.log('Solicitando compra:', {
      store: selectedStore,
      items: items,
      total: totalPrice
    });
    
    // Por enquanto, apenas um alert para demonstrar
    alert(`Compra solicitada!\nEstabelecimento: ${selectedStore?.name || 'Não selecionado'}\nItens: ${items.length}\nTotal: R$ ${totalPrice.toFixed(2).replace('.', ',')}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .pulse-red {
            animation: pulse-red 1.5s infinite;
          }
          @keyframes pulse-red {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          .product-highlight {
            display: inline-block;
            white-space: nowrap;
          }
        `
      }} />
      
      {/* Input invisível para captura de arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
              <ArrowLeft size={20} />
            </div>
            <h1 className="text-xl font-medium">Lista de produtos da compra</h1>
          </div>
          <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
            <Bookmark size={20} />
          </div>
        </div>
        
        {/* Store Selection */}
        <div className="bg-white rounded-xl text-gray-700 relative">
          {!selectedStore ? (
            <div 
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 rounded-xl"
              onClick={() => setShowStoreSearchResults(!showStoreSearchResults)}
            >
              <Store className="text-gray-600" size={24} />
              <input 
                type="text"
                placeholder="Selecione um estabelecimento..."
                className="flex-1 bg-transparent outline-none text-gray-600"
                value={storeSearchText}
                onChange={(e) => {
                  setStoreSearchText(e.target.value);
                  setShowStoreSearchResults(true);
                }}
                onFocus={() => setShowStoreSearchResults(true)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    selectStoreFromSearch();
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl">
              <img 
                src={selectedStore.image} 
                alt={selectedStore.name}
                className="w-6 h-6 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                  <span className="text-gray-800">
                    {selectedStore.name} • {selectedStore.address}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  {selectedStore.category}
                </span>
                <button 
                  onClick={clearStoreSelection}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* Lista flutuante de estabelecimentos */}
          {showStoreSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-80 overflow-y-auto z-50">
              {filteredStores.map((store, index) => (
                <div 
                  key={store.id}
                  onClick={() => selectStore(store)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl last:border-b-0 ${
                    index === selectedStoreIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={store.image} 
                      alt={store.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800 text-sm">{store.name}</h4>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-2">
                          {store.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          <div className="flex items-center gap-2 bg-blue-100 rounded-2xl px-4 py-3 whitespace-nowrap">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {items.length}
            </div>
            <span className="text-gray-600">Itens na lista</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 rounded-2xl px-4 py-3 whitespace-nowrap">
            <div className="px-3 py-1 bg-blue-500 rounded-full text-white text-sm font-medium">
              R${totalPrice.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-gray-600">Total estimado</span>
          </div>
          
          {/* Botão Solicitar Compra - aparece acima da navegação quando há itens */}
          {items.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <button
                onClick={handleRequestPurchase}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-3 transition-colors font-medium shadow-sm"
              >
                <ShoppingCart size={20} />
                <span>Solicitar compra</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                <ShoppingBasket size={48} className="text-gray-400" />
              </div>
            </div>
            <h2 className="text-xl text-gray-600 font-medium mb-2">
              Minha lista de compras está vazia
            </h2>
            <p className="text-gray-500">
              Use a busca por texto, voz ou câmera para adicionar produtos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 text-base leading-tight">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.brand}</p>
                      </div>
                      <p className="text-lg font-semibold text-blue-600 ml-3">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white px-4 py-4 rounded-t-3xl shadow-lg">
        {/* Lista de resultados flutuante para busca simples */}
        {showSearchResults && filteredProducts.length > 0 && activeTab !== 'text' && (
          <div className="mb-4 bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto">
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id}
                onClick={() => {
                  addItem(product);
                  setSearchText('');
                  setShowSearchResults(false);
                  setSelectedProductIndex(-1);
                }}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg last:border-b-0 ${
                  index === selectedProductIndex ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.brand}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sugestões flutuantes para contentEditable */}
        {showSuggestions && suggestions.length > 0 && activeTab === 'text' && (
          <div
            className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-30 min-w-48 mb-4"
            style={{
              left: `${suggestionPosition.x + 16}px`,
              bottom: `${120 - suggestionPosition.y}px`
            }}
          >
            <div className="p-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <p className="text-xs text-gray-600">
                Pressione <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd> para confirmar ou <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Espaço</kbd> para rejeitar
              </p>
            </div>
            {suggestions.map((product, index) => (
              <div
                key={product.id}
                className={`px-4 py-2 cursor-pointer flex items-center gap-2 last:rounded-b-lg ${
                  index === selectedSuggestion 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => addProductFromEditor(product)}
              >
                <Plus size={14} className="text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.brand}</div>
                </div>
                <div className="text-sm font-semibold text-blue-600">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </div>
                {index === selectedSuggestion && (
                  <span className="ml-auto text-xs text-gray-500">Enter</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Indicador de status de voz */}
        {isListening && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full pulse-red"></div>
              <span className="text-sm text-red-600 font-medium">
                🎤 Escutando... Diga o nome do produto
              </span>
            </div>
            <p className="text-xs text-red-500 text-center mt-1">
              Diga "confirmar" ou "ok" para adicionar o produto selecionado
            </p>
          </div>
        )}
        
        {/* Input Section */}
        {activeTab === 'text' ? (
          <div className="relative">
            {/* Editor contentEditable */}
            <div className="bg-white rounded-lg p-3 border border-gray-200 relative">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                className="w-full min-h-[40px] max-h-[200px] overflow-y-auto outline-none text-gray-700 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
                data-placeholder="Digite sua lista de produtos ou receita aqui... Ex: 2 xícaras de arroz, 1kg de feijão preto..."
              />
              
              {/* Botões de ação */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {selectedProducts.length > 0 && (
                    <button
                      onClick={clearAllProducts}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <X size={12} />
                      Limpar produtos
                    </button>
                  )}
                </div>
                
                <button
                  onClick={autoIdentifyProducts}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                  title="Identificar produtos automaticamente"
                >
                  <Wand2 size={14} />
                  Auto-identificar
                </button>
              </div>
            </div>

            {/* Lista de produtos identificados */}
            {selectedProducts.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-800 text-sm">
                    Produtos identificados ({selectedProducts.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedProducts.map((product, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                    >
                      {product.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white rounded-lg p-3">
            {activeTab === 'search' && <Search size={20} className="text-blue-500" />}
            {activeTab === 'voice' && <Mic size={20} className={isListening ? "text-red-500" : "text-blue-500"} />}
            {activeTab === 'camera' && <Camera size={20} className="text-blue-500" />}
            <input 
              type="text"
              placeholder={isListening ? "Escutando... diga o nome do produto" : "Busque por um produto ou características..."}
              className={`flex-1 bg-transparent outline-none ${isListening ? 'text-red-600' : 'text-gray-700'}`}
              value={searchText}
              onFocus={() => {
                if (!isListening) {
                  setActiveTab('search');
                  setShowSearchResults(!!searchText);
                }
              }}
              onBlur={() => setTimeout(() => {
                if (!isListening) {
                  setShowSearchResults(false);
                  setShowStoreSearchResults(false);
                }
              }, 200)}
              onChange={(e) => {
                if (!isListening) {
                  setSearchText(e.target.value);
                  if (e.target.value) {
                    setShowSearchResults(true);
                    setActiveTab('search');
                  }
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isListening) {
                  addItemFromSearch();
                }
              }}
              readOnly={isListening}
            />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        {/* Navegação principal */}
        <div className="px-4 py-3">
          <div className="flex justify-around items-center">
            <button 
              onClick={() => {
                if (isListening) stopListening();
                setActiveTab('search');
                setShowSuggestions(false);
              }}
              className={`p-2 rounded-full transition-colors ${activeTab === 'search' && !isListening ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <Search size={24} className={activeTab === 'search' && !isListening ? "text-blue-500" : "text-gray-400"} />
            </button>
            
            <button 
              onClick={toggleVoiceSearch}
              className={`p-3 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600' 
                  : activeTab === 'voice' 
                    ? 'bg-blue-100 text-blue-500' 
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
              }`}
            >
              <Mic size={24} />
            </button>
            
            <button 
              onClick={handleCameraClick}
              className={`p-2 rounded-full transition-all duration-200 ${
                cameraPressed
                  ? 'bg-blue-500 text-white scale-95'
                  : activeTab === 'camera'
                    ? 'bg-blue-100 text-blue-500'
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
              }`}
            >
              <Camera size={24} />
            </button>
            
            <button 
              onClick={() => {
                if (isListening) stopListening();
                setActiveTab('text');
                setShowSearchResults(false);
              }}
              className={`p-2 rounded-full transition-colors ${activeTab === 'text' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <FileText size={24} className={activeTab === 'text' ? "text-blue-500" : "text-gray-400"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
