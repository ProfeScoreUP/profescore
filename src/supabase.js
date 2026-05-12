import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zcqsdovvsjtubetqybwc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjcXNkb3Z2c2p0dWJldHF5YndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzMxMDAsImV4cCI6MjA5NDEwOTEwMH0.EBL98vJn_3rXuMTTsg9kdaEr664d0eRR2qqN0x-qlgI'

export const supabase = createClient(supabaseUrl, supabaseKey)