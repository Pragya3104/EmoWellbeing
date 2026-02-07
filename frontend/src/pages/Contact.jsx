import React, { useState } from 'react'
import { sendContactMessage } from "../api"

export default function Contact(){
  const [form, setForm] = useState({name:'', email:'', message:''})
  

  async function submit(e) {
    e.preventDefault();
    await sendContactMessage(form);
    alert("We received your message. Thank you!");
   setForm({ name: "", email: "", message: "" });
  }


  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={submit} className="card p-8">
          <h3 className="text-2xl font-semibold text-[#4b2c82] mb-4">Send Us a Message</h3>
          <label className="block text-sm mb-2">Name</label>
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-3 mb-4 border rounded-lg" placeholder="Your name" />

          <label className="block text-sm mb-2">Email</label>
          <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full p-3 mb-4 border rounded-lg" placeholder="you@email.com" />

          <label className="block text-sm mb-2">Message</label>
          <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="w-full p-3 mb-4 border rounded-lg min-h-[160px]" placeholder="Tell us how we can help..." />

          <button className="btn-primary">Send Message</button>
        </form>

        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <h4 className="font-semibold text-[#4b2c82]">Other Ways to Reach Us</h4>
            <p className="mt-3 text-sm text-[#6b21a8]">Email — emowellcontact@gmail.com <br/>We typically respond within 24 hours.</p>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-[#b33b3b]">In Crisis?</h4>
            <p className="mt-3 text-sm text-[#6b21a8]">If you're experiencing a mental health crisis, please reach out to these resources immediately:</p>
            <ul className="mt-3 text-sm text-[#6b21a8] space-y-2">
              <li><strong>National Suicide Prevention Lifeline (Ind)</strong> — Call : 14416</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
