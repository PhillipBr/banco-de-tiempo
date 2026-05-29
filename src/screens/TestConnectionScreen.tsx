import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import Header from "../components/Header";
import { styles } from "../theme/styles";
import { supabase } from "../lib/supabase";

export default function TestConnectionScreen() {
  const [status, setStatus] = useState("Conectando...");

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const { data, error } = await supabase.from("services").select("*");

    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }

    setStatus(`Supabase conectado. Servicios encontrados: ${data.length}`);
  };

  return (
    <View style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Supabase Test</Text>

        <Text style={styles.screenSubtitle}>{status}</Text>
      </View>
    </View>
  );
}