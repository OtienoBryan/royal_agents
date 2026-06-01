import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MessageCircle, Plus, Users, Send, User } from 'lucide-react'
import { DateTime } from 'luxon'

interface Staff {
  id: number
  name: string
  business_email: string
  role: string
  avatar_url: string
}

interface ChatRoom {
  id: number
  name: string
  description?: string
  type: string
  members: Staff[]
  messages: ChatMessage[]
  createdBy: number
  createdAt: string
}

interface ChatMessage {
  id: number
  content: string
  messageType: string
  senderId: number
  sender?: Staff
  chatRoomId: number
  createdAt: string
}

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [staff, setStaff] = useState<Staff[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [lastMessageId, setLastMessageId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (user) {
      // Load initial data
      loadChatRooms()
      loadStaff()
    }
  }, [user])

  useEffect(() => {
    if (selectedRoom) {
      // Start polling for new messages with adaptive interval
      const pollInterval = lastMessageId ? 3000 : 1000 // Slower polling if no recent messages
      pollingInterval.current = setInterval(() => {
        pollForNewMessages()
      }, pollInterval)

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
        }
      }
    }
  }, [selectedRoom, lastMessageId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling on mobile
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [messages])

  const loadChatRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('adminToken')
      console.log('🔍 Loading chat rooms...', { token: token ? 'exists' : 'missing' })
      
      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 Chat rooms API response:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        const rooms = await response.json()
        console.log('💬 Chat rooms data received:', rooms)
        setChatRooms(rooms)
      } else {
        const errorText = await response.text()
        console.error('❌ Chat rooms API error:', errorText)
        setError('Failed to load chat rooms')
      }
    } catch (error) {
      console.error('❌ Error loading chat rooms:', error)
      setError('Failed to load chat rooms')
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      console.log('🔍 Loading staff members...', { token: token ? 'exists' : 'missing' })
      
      const response = await fetch('/api/chat/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 Staff API response:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        const staffData = await response.json()
        console.log('👥 Staff data received:', staffData)
        setStaff(staffData)
      } else {
        const errorText = await response.text()
        console.error('❌ Staff API error:', errorText)
      }
    } catch (error) {
      console.error('❌ Error loading staff:', error)
    }
  }

  const loadMessages = async (roomId: number, limit: number = 50) => {
    try {
      setLoadingMessages(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/chat/rooms/${roomId}/messages?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const messagesData = await response.json()
        // Messages come in DESC order from backend, reverse to show oldest first
        const sortedMessages = messagesData.reverse()
        setMessages(sortedMessages)
        
        if (sortedMessages.length > 0) {
          // Set lastMessageId to the most recent message ID
          setLastMessageId(sortedMessages[sortedMessages.length - 1].id)
        }
        
        // Scroll to bottom after a short delay to ensure DOM is updated
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const pollForNewMessages = async () => {
    if (!selectedRoom || !lastMessageId) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages/new?lastMessageId=${lastMessageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const newMessages = await response.json()
        
        if (newMessages.length > 0) {
          // Add new messages to the end of the existing messages
          setMessages(prev => [...prev, ...newMessages])
          // Update lastMessageId to the most recent message
          setLastMessageId(newMessages[newMessages.length - 1].id)
          
          // Scroll to bottom to show new messages
          setTimeout(() => {
            scrollToBottom()
          }, 50)
        }
      }
    } catch (error) {
      console.error('Error polling for new messages:', error)
    }
  }

  const createChatRoom = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const requestData = {
        name: newRoomName,
        memberIds: selectedMembers,
        createdBy: user?.id
      }
      
      console.log('🔍 [Frontend] Creating chat room with data:', requestData)
      console.log('🔍 [Frontend] User object:', user)
      
      if (!user?.id) {
        console.error('❌ [Frontend] No user ID available')
        alert('Error: User not logged in properly')
        return
      }
      
      if (!newRoomName.trim()) {
        console.error('❌ [Frontend] Room name is empty')
        alert('Please enter a room name')
        return
      }
      
      if (selectedMembers.length === 0) {
        console.error('❌ [Frontend] No members selected')
        alert('Please select at least one member')
        return
      }
      
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      console.log('📡 [Frontend] Create room response status:', response.status)
      
      if (response.ok) {
        const newRoom = await response.json()
        console.log('✅ [Frontend] Room created successfully:', newRoom)
        setChatRooms(prev => [newRoom, ...prev])
        setShowCreateRoom(false)
        setNewRoomName('')
        setSelectedMembers([])
      } else {
        const errorText = await response.text()
        console.error('❌ [Frontend] Create room failed:', response.status, errorText)
        alert(`Failed to create room: ${errorText}`)
      }
    } catch (error) {
      console.error('❌ [Frontend] Error creating chat room:', error)
      alert('Error creating chat room')
    }
  }

  const sendMessage = async () => {
    if (newMessage.trim() && selectedRoom && user) {
      const messageContent = newMessage.trim()
      
      // Optimistically add the message to the UI immediately
      const tempMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        content: messageContent,
        messageType: 'text',
        senderId: user.id,
        chatRoomId: selectedRoom.id,
        createdAt: DateTime.now().setZone('Africa/Nairobi').toISO() || new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          business_email: user.email,
          role: 'agent',
          avatar_url: ''
        }
      }
      
      // Add the message to the UI immediately
      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
      
      // Scroll to bottom immediately
      setTimeout(() => {
        scrollToBottom()
      }, 50)
      
      try {
        const token = localStorage.getItem('adminToken')
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatRoomId: selectedRoom.id,
            content: messageContent,
            senderId: user.id,
            messageType: 'text'
          })
        })
        
        if (response.ok) {
          const sentMessage = await response.json()
          // Replace the temporary message with the real one from server
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessage.id ? { ...sentMessage, sender: tempMessage.sender } : msg
          ))
          
          // Update lastMessageId
          setLastMessageId(sentMessage.id)
        } else {
          // If sending failed, remove the temporary message
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
          alert('Failed to send message')
        }
      } catch (error) {
        console.error('Error sending message:', error)
        // If sending failed, remove the temporary message
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        alert('Error sending message')
      }
    }
  }

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room)
    setLastMessageId(null)
    loadMessages(room.id)
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const formatTime = (dateString: string) => {
    const date = DateTime.fromISO(dateString).setZone('Africa/Nairobi')
    const now = DateTime.now().setZone('Africa/Nairobi')
    
    // If it's today, show only time
    if (date.hasSame(now, 'day')) {
      return date.toFormat('HH:mm')
    }
    
    // If it's yesterday, show "Yesterday HH:mm"
    if (date.hasSame(now.minus({ days: 1 }), 'day')) {
      return `Yesterday ${date.toFormat('HH:mm')}`
    }
    
    // If it's this week, show day and time
    if (date.hasSame(now, 'week')) {
      return date.toFormat('EEE HH:mm')
    }
    
    // Otherwise show date and time
    return date.toFormat('MMM dd, HH:mm')
  }

  const toggleMember = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`${selectedRoom ? 'hidden md:flex md:w-1/4' : 'w-full md:w-1/4'} bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">Chat Rooms</h2>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors touch-manipulation"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-[11px] text-gray-600">Loading rooms...</span>
            </div>
          ) : error ? (
            <div className="p-2 text-center">
              <p className="text-red-600 text-[11px]">{error}</p>
              <button 
                onClick={loadChatRooms}
                className="mt-1 text-blue-600 text-[11px] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className={`p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 touch-manipulation ${
                selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-medium text-gray-900 truncate">
                    {room.name}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {room.members?.length || 0} member{(room.members?.length || 0) !== 1 ? 's' : ''}
                    {room.members && room.members.length > 0 && (
                      <span className="ml-1 text-gray-400">
                        ({room.members.map(m => m.name).join(', ')})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedRoom ? (
          <>
            {/* Mobile Back Button */}
            <div className="md:hidden p-2 bg-white border-b border-gray-200">
              <button
                onClick={() => setSelectedRoom(null)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-[11px]"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Rooms</span>
              </button>
            </div>

            {/* Chat Header */}
            <div className="p-2 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <MessageCircle className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedRoom.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {selectedRoom.members?.map(member => member.name).join(', ') || 'No members'}
                    <span className="ml-1 text-[10px] text-gray-400">• Nairobi time</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {loadingMessages ? (
                <div className="flex items-center justify-center p-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-[11px] text-gray-600">Loading messages...</span>
                </div>
              ) : (
                messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-xs lg:max-w-md px-2 py-1 rounded ${
                      message.senderId === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.senderId !== user?.id && (
                      <div className="flex items-center space-x-1 mb-0.5">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-[10px] font-medium text-gray-600">
                          {message.sender?.name}
                        </span>
                      </div>
                    )}
                    <p className="text-[11px]">{message.content}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        message.senderId === user?.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
                ))
              )}
              
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-2 bg-white border-t border-gray-200">
              <div className="flex space-x-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Select a chat room</h3>
              <p className="text-[11px] text-gray-500">Choose a room from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-3 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Create Chat Room</h2>
            
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Select Members
                </label>
                <div className="max-h-48 md:max-h-40 overflow-y-auto border border-gray-300 rounded">
                  {staff.filter(s => s.id !== user?.id).map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer touch-manipulation"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex items-center space-x-1">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-900">{member.name}</p>
                          <p className="text-[10px] text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-2 mt-3">
              <button
                onClick={() => {
                  setShowCreateRoom(false)
                  setNewRoomName('')
                  setSelectedMembers([])
                }}
                className="flex-1 px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors touch-manipulation text-[11px]"
              >
                Cancel
              </button>
              <button
                onClick={createChatRoom}
                disabled={!newRoomName.trim() || selectedMembers.length === 0}
                className="flex-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-[11px]"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
